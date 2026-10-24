/**
 * AI product comparison.
 *
 * With an AI provider configured the comparison is generated server-side (the
 * API key never leaves the server). Without one — or when the provider call
 * fails — a deterministic comparison is built from the stored specifications
 * and explicitly labelled as rule-based, never presented as AI output.
 */
import { env } from "./env.ts";
import { tokenize } from "./embeddings.ts";
import { logLine } from "./monitoring.ts";

export interface CompareProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  rating: number;
  category: string;
  stock: number;
  features: string[] | null;
  image_url?: string;
}

export interface ComparedProduct {
  id: string;
  name: string;
  price: number;
  rating: number;
  category: string;
  score: number;
  suitability: number;
  pros: string[];
  cons: string[];
  bestFor: string;
  verdict: string;
}

export interface CompareResult {
  mode: "ai" | "rules";
  provider: string | null;
  notice: string;
  requirements: string;
  summary: string;
  winners: {
    bestOverall: string | null;
    bestValue: string | null;
    bestForRequirements: string | null;
  };
  products: ComparedProduct[];
}

const USE_CASE_RULES: { pattern: RegExp; label: string }[] = [
  { pattern: /gaming|rtx|gpu|144hz|240hz|120hz|refresh|vr|console/i, label: "gaming and high-refresh workloads" },
  { pattern: /camera|photograph|photo|108mp|lens|video/i, label: "photography and content capture" },
  { pattern: /battery|all-day|travel|7-day|portable|lightweight/i, label: "travel and all-day use" },
  { pattern: /office|work|productivity|programming|developer|monitor|usb-c|keyboard/i, label: "work and productivity" },
  { pattern: /smart home|assistant|speaker|hub|multi-room/i, label: "smart-home automation" },
  { pattern: /budget|affordable|cheap|value/i, label: "budget-conscious buyers" },
  { pattern: /headphone|audio|noise|sound|music/i, label: "audio and focused listening" },
];

function round(value: number, digits = 1): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function bestUseCase(product: CompareProduct): string {
  const haystack = `${product.name} ${product.category} ${(product.features ?? []).join(" ")}`;
  const rule = USE_CASE_RULES.find((entry) => entry.pattern.test(haystack));
  return rule ? rule.label : `${product.category.toLowerCase()} use`;
}

function matchScore(product: CompareProduct, requirementTokens: string[]): number {
  if (requirementTokens.length === 0) return 0;
  const haystack = tokenize(`${product.name} ${product.category} ${product.description} ${(product.features ?? []).join(" ")}`);
  const haystackSet = new Set(haystack);
  const matches = requirementTokens.filter((token) => haystackSet.has(token)).length;
  return Math.min(1, matches / requirementTokens.length);
}

export function buildRuleBasedComparison(products: CompareProduct[], requirements: string): CompareResult {
  const prices = products.map((product) => product.price);
  const ratings = products.map((product) => product.rating);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const minRating = Math.min(...ratings);
  const maxRating = Math.max(...ratings);
  const requirementTokens = tokenize(requirements);

  const compared: ComparedProduct[] = products.map((product) => {
    const requirementMatch = matchScore(product, requirementTokens);
    const valueRatio = maxPrice === minPrice ? 1 : (maxPrice - product.price) / (maxPrice - minPrice);
    const featureCount = (product.features ?? []).length;
    const availability = product.stock > 0 ? 1 : 0;

    const score = round(
      (product.rating / 5) * 40 +
        valueRatio * 25 +
        requirementMatch * 20 +
        availability * 10 +
        Math.min(1, featureCount / 5) * 5,
    );

    const pros: string[] = [];
    const cons: string[] = [];

    if (product.price === minPrice && products.length > 1) pros.push("Lowest price in this comparison");
    if (product.rating === maxRating && products.length > 1) pros.push(`Highest rating here (${product.rating}/5)`);
    if (product.stock > 10) pros.push(`${product.stock} units in stock`);
    for (const feature of (product.features ?? []).slice(0, 2)) pros.push(feature);
    if (requirementMatch > 0.25) pros.push("Closely matches the stated requirements");

    if (product.price === maxPrice && products.length > 1) cons.push("Most expensive option in this comparison");
    if (product.rating === minRating && products.length > 1) cons.push(`Lowest rating here (${product.rating}/5)`);
    if (product.stock === 0) cons.push("Currently out of stock");
    else if (product.stock <= 5) cons.push(`Low stock (${product.stock} left)`);
    if (featureCount < 3) cons.push("Fewer documented specifications");

    return {
      id: product.id,
      name: product.name,
      price: product.price,
      rating: product.rating,
      category: product.category,
      score,
      suitability: round(requirementMatch * 100),
      pros: pros.slice(0, 4),
      cons: cons.slice(0, 3),
      bestFor: bestUseCase(product),
      verdict: `${product.name} is $${product.price.toFixed(2)} and suits ${bestUseCase(product)}.`,
    };
  });

  const bestOverall = [...compared].sort((a, b) => b.score - a.score)[0];
  const bestValue = [...products].sort((a, b) => b.rating / b.price - a.rating / a.price)[0];
  const bestForRequirements = [...compared].sort((a, b) => b.suitability - a.suitability)[0];
  const hasRequirements = requirements.trim().length > 0 && requirementTokens.length > 0;

  const winnerNames = compared
    .filter((product) => product.id === bestOverall?.id || product.id === bestValue?.id)
    .map((product) => product.name);

  const summary = [
    `Rule-based comparison of ${products.length} products.`,
    bestOverall ? `${bestOverall.name} leads on overall suitability (${bestOverall.score}/100).` : "",
    bestValue ? `${bestValue.name} offers the strongest rating for its price.` : "",
    hasRequirements && bestForRequirements
      ? `${bestForRequirements.name} matches your stated requirements most closely (${bestForRequirements.suitability}% keyword match).`
      : "Add your requirements to see a closer fit.",
    winnerNames.length > 1 ? "No single product wins every category." : "",
  ].filter(Boolean).join(" ");

  return {
    mode: "rules",
    provider: null,
    notice:
      "AI provider is not configured on the server, so this comparison is generated from the stored product specifications (rule-based, not an LLM).",
    requirements,
    summary,
    winners: {
      bestOverall: bestOverall?.id ?? null,
      bestValue: bestValue?.id ?? null,
      bestForRequirements: hasRequirements ? bestForRequirements?.id ?? null : null,
    },
    products: compared,
  };
}

interface AiComparisonPayload {
  summary?: string;
  products?: {
    id?: string;
    score?: number;
    suitability?: number;
    pros?: string[];
    cons?: string[];
    bestFor?: string;
    verdict?: string;
  }[];
  winners?: { bestOverall?: string; bestValue?: string; bestForRequirements?: string };
}

async function generateAiComparison(products: CompareProduct[], requirements: string): Promise<CompareResult> {
  const catalog = products.map((product) => ({
    id: product.id,
    name: product.name,
    price: product.price,
    rating: product.rating,
    category: product.category,
    stock: product.stock,
    features: product.features ?? [],
    description: product.description,
  }));

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${env.openaiKey}`,
    },
    body: JSON.stringify({
      model: env.openaiModel,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are ShopAi's product analyst. Compare ONLY the provided products using only the provided fields. " +
            "Return JSON: {summary, products:[{id, score (0-100), suitability (0-100 for the shopper requirements), pros:[..], cons:[..], bestFor, verdict}], " +
            "winners:{bestOverall, bestValue, bestForRequirements}} using product ids. Never invent specifications or prices.",
        },
        {
          role: "user",
          content: JSON.stringify({ requirements: requirements || "No specific requirements given.", products: catalog }),
        },
      ],
    }),
  });

  if (!res.ok) throw new Error(`AI provider responded ${res.status}`);
  const body = await res.json() as { choices?: { message?: { content?: string } }[] };
  const content = body.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI provider returned an empty response");

  const parsed = JSON.parse(content) as AiComparisonPayload;
  const ruleBased = buildRuleBasedComparison(products, requirements);
  const byId = new Map(ruleBased.products.map((product) => [product.id, product]));

  const merged = products.map((product) => {
    const base = byId.get(product.id)!;
    const generated = parsed.products?.find((entry) => entry.id === product.id);
    if (!generated) return base;
    return {
      ...base,
      score: typeof generated.score === "number" ? Math.max(0, Math.min(100, Math.round(generated.score))) : base.score,
      suitability: typeof generated.suitability === "number"
        ? Math.max(0, Math.min(100, Math.round(generated.suitability)))
        : base.suitability,
      pros: generated.pros?.filter((item) => typeof item === "string").slice(0, 5) ?? base.pros,
      cons: generated.cons?.filter((item) => typeof item === "string").slice(0, 4) ?? base.cons,
      bestFor: generated.bestFor ?? base.bestFor,
      verdict: generated.verdict ?? base.verdict,
    };
  });

  const validIds = new Set(products.map((product) => product.id));
  const pick = (id?: string) => (id && validIds.has(id) ? id : null);

  return {
    mode: "ai",
    provider: `openai:${env.openaiModel}`,
    notice: "Generated by the configured AI provider from the stored product specifications.",
    requirements,
    summary: parsed.summary ?? ruleBased.summary,
    winners: {
      bestOverall: pick(parsed.winners?.bestOverall) ?? ruleBased.winners.bestOverall,
      bestValue: pick(parsed.winners?.bestValue) ?? ruleBased.winners.bestValue,
      bestForRequirements: pick(parsed.winners?.bestForRequirements) ?? ruleBased.winners.bestForRequirements,
    },
    products: merged,
  };
}

export async function compareProducts(products: CompareProduct[], requirements: string): Promise<CompareResult> {
  if (env.openaiKey) {
    try {
      return await generateAiComparison(products, requirements);
    } catch (error) {
      logLine("warn", "AI comparison failed, falling back to rule-based analysis", {
        reason: error instanceof Error ? error.message : "unknown",
      });
      const fallback = buildRuleBasedComparison(products, requirements);
      fallback.notice =
        "The AI provider request failed, so this comparison was generated from the stored product specifications (rule-based, not an LLM).";
      return fallback;
    }
  }
  return buildRuleBasedComparison(products, requirements);
}
