/**
 * AI shopping assistant.
 *
 * Retrieval always runs against the live catalog, so every product card carries
 * the real price, stock and rating. The language model only writes the prose:
 * when no provider is configured the endpoint says so explicitly instead of
 * pretending an AI answered.
 */
import { env } from "../lib/env.ts";
import { HttpError, json, readJson } from "../lib/http.ts";
import { availabilityOf, loadCatalog, matchesQuery, type CatalogProduct } from "./catalog.ts";
import type { RouteContext } from "../lib/types.ts";

interface AssistantProduct {
  id: string;
  name: string;
  price: number;
  image_url: string;
  category: string;
  brand: string | null;
  stock: number;
  rating_avg: number | null;
  review_count: number;
  availability: "in_stock" | "low_stock" | "out_of_stock";
  url: string;
}

interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

const MAX_MESSAGE = 500;
const SETUP_HINT =
  "Set OPENAI_API_KEY in the app secrets (server-side only) to turn on conversational answers.";

function toCard(product: CatalogProduct): AssistantProduct {
  return {
    id: product.id,
    name: product.name,
    price: product.price,
    image_url: product.image_url,
    category: product.category,
    brand: product.brand,
    stock: product.stock,
    rating_avg: product.rating_avg,
    review_count: product.review_count,
    availability: availabilityOf(product.stock),
    url: `/product/${product.id}`,
  };
}

function parseBudget(message: string): number | null {
  const patterns = [
    /(?:under|below|less than|up to|max(?:imum)?(?: of)?|budget(?: of)?|cheaper than)\s*\$?\s*(\d+(?:[.,]\d+)?)/i,
    /\$\s*(\d+(?:[.,]\d+)?)/,
    /(\d+(?:[.,]\d+)?)\s*(?:dollars|usd)/i,
  ];
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) {
      const value = Number(match[1].replace(",", "."));
      if (Number.isFinite(value) && value > 0) return value;
    }
  }
  return null;
}

function retrieve(message: string, products: CatalogProduct[]): AssistantProduct[] {
  const budget = parseBudget(message);
  const pool = budget == null ? products : products.filter((product) => product.price <= budget);
  const scored = pool
    .map((product) => ({ product, score: matchesQuery(product, message) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || (b.product.rating_avg ?? 0) - (a.product.rating_avg ?? 0));

  const ranked = (scored.length > 0 ? scored.map((row) => row.product) : pool
    .slice()
    .sort((a, b) => (b.rating_avg ?? 0) - (a.rating_avg ?? 0)));

  const affordable = budget == null ? ranked : ranked.filter((product) => product.price <= budget);
  return affordable.slice(0, 4).map(toCard);
}

function systemPrompt(products: AssistantProduct[]): string {
  const catalog = products.map((product) => ({
    name: product.name,
    brand: product.brand,
    category: product.category,
    price: product.price,
    stock: product.stock,
    availability: product.availability,
    rating: product.rating_avg,
    reviews: product.review_count,
  }));

  return [
    "You are ShopAi's shopping assistant for an online electronics and lifestyle store.",
    "Recommend ONLY products from the candidate list below. Never invent a product, price, rating or stock figure.",
    "Quote prices in USD exactly as given. Mention availability when stock is low or zero.",
    "Keep answers under 120 words, friendly and concrete. Offer at most three products.",
    "If the request is vague (no budget, use case or category), ask one short clarifying question.",
    "If nothing fits, say so honestly and suggest what detail would help you search.",
    `Candidate products (JSON): ${JSON.stringify(catalog)}`,
  ].join("\n");
}

export async function handleAssistantStatus(): Promise<Response> {
  return json({
    configured: Boolean(env.openaiKey),
    model: env.openaiKey ? env.openaiModel : null,
    setupHint: env.openaiKey ? null : SETUP_HINT,
  });
}

export async function handleAssistantChat({ req }: RouteContext): Promise<Response> {
  const body = await readJson<{ message?: string; history?: ChatTurn[] }>(req);
  const message = (body.message ?? "").trim();
  if (!message) throw new HttpError(400, "Type a question first", "invalid_message");
  if (message.length > MAX_MESSAGE) {
    throw new HttpError(400, `Keep your question under ${MAX_MESSAGE} characters`, "invalid_message");
  }

  const { products } = await loadCatalog();
  const candidates = retrieve(message, products);

  // No provider configured: answer honestly with a setup requirement and the
  // real catalog matches, never a fabricated AI reply.
  if (!env.openaiKey) {
    const matchLine = candidates.length > 0
      ? "These are the closest matches in the live catalog:"
      : "I couldn't find anything in the catalog for that request yet.";
    return json({
      configured: false,
      mode: "catalog",
      reply: `The AI assistant is installed but no AI provider is connected yet. ${SETUP_HINT} ${matchLine}`,
      setupHint: SETUP_HINT,
      products: candidates,
      suggestions: ["Find similar products", "Show me something cheaper", "Compare these products"],
    });
  }

  const history: ChatTurn[] = Array.isArray(body.history)
    ? body.history
        .filter((turn) => (turn.role === "user" || turn.role === "assistant") && typeof turn.content === "string")
        .slice(-6)
        .map((turn) => ({ role: turn.role, content: turn.content.slice(0, 1000) }))
    : [];

  let reply: string;
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        authorization: `Bearer ${env.openaiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: env.openaiModel,
        temperature: 0.4,
        max_tokens: 400,
        messages: [
          { role: "system", content: systemPrompt(candidates) },
          ...history,
          { role: "user", content: message },
        ],
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(`OpenAI responded ${response.status}: ${detail.slice(0, 200)}`);
    }

    const payload = await response.json() as {
      choices?: { message?: { content?: string } }[];
    };
    reply = (payload.choices?.[0]?.message?.content ?? "").trim();
    if (!reply) throw new Error("The AI provider returned an empty answer");
  } catch (error) {
    const reason = error instanceof Error ? error.message : "unknown";
    throw new HttpError(502, "The AI provider could not answer right now. Please try again.", "ai_request_failed", reason);
  }

  return json({
    configured: true,
    mode: "ai",
    reply,
    setupHint: null,
    products: candidates,
    suggestions: ["Find similar products", "Compare these products", "Show me something cheaper"],
  });
}
