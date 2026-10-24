/**
 * Product embeddings for semantic search.
 *
 * When an AI provider is configured (OPENAI_API_KEY) the API asks it for
 * `text-embedding-3-small` vectors. Without a provider it computes a local
 * hashed bag-of-words/trigram embedding instead and records that in the
 * `source` column, so the UI can honestly label which kind of ranking ran.
 * Both paths produce 1536-dimensional vectors stored in pgvector.
 */
import { dbSelect, dbUpsert } from "./db.ts";
import { env } from "./env.ts";
import { logLine } from "./monitoring.ts";

export const EMBEDDING_DIM = 1536;

export interface ProductRow {
  id: string;
  name: string;
  description: string;
  category: string;
  features: string[] | null;
  is_active?: boolean;
  updated_at?: string;
}

const OPENAI_SOURCE = `openai:${env.openaiEmbeddingModel}`;
export const LOCAL_SOURCE = "local-hash";

export function hasAiProvider(): boolean {
  return Boolean(env.openaiKey);
}

export function embeddingSource(): string {
  return hasAiProvider() ? OPENAI_SOURCE : LOCAL_SOURCE;
}

export function productToText(product: ProductRow): string {
  return [
    product.name,
    product.category,
    product.description,
    ...(product.features ?? []),
  ].join(" . ");
}

function fnv1a(value: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

/** The meaningful words of a sentence (no trigrams, no stop words). */
export function keywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 1 && !STOP_WORDS.has(word));
}

export function tokenize(text: string): string[] {
  const words = keywords(text);

  const tokens: string[] = [...words];
  for (const word of words) {
    const padded = `#${word}#`;
    for (let i = 0; i < padded.length - 2; i += 1) tokens.push(padded.slice(i, i + 3));
  }
  return tokens;
}

const STOP_WORDS = new Set([
  "the", "a", "an", "for", "with", "and", "or", "of", "to", "in", "on", "is", "are",
  "me", "my", "i", "need", "want", "find", "show", "some", "that", "this", "it",
  "good", "great", "best", "please", "looking", "look", "under", "over", "less",
  "than", "about", "have", "has", "you", "your", "can", "could", "would",
]);

/** Deterministic local embedding: hashed tokens with signed term frequency. */
export function hashEmbed(text: string, dims = EMBEDDING_DIM): number[] {
  const vector = new Array<number>(dims).fill(0);
  const counts = new Map<string, number>();
  for (const token of tokenize(text)) counts.set(token, (counts.get(token) ?? 0) + 1);

  for (const [token, count] of counts) {
    const hash = fnv1a(token);
    const index = hash % dims;
    const sign = fnv1a(`${token}#sign`) % 2 === 0 ? 1 : -1;
    vector[index] += sign * (1 + Math.log(count));
  }

  let norm = 0;
  for (const value of vector) norm += value * value;
  norm = Math.sqrt(norm);
  if (norm === 0) {
    vector[0] = 1;
    return vector;
  }
  return vector.map((value) => value / norm);
}

function toVectorLiteral(vector: number[]): string {
  return `[${vector.map((value) => Number(value.toFixed(6))).join(",")}]`;
}

async function openAiEmbeddings(inputs: string[]): Promise<number[][]> {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${env.openaiKey}`,
    },
    body: JSON.stringify({
      model: env.openaiEmbeddingModel,
      input: inputs,
      dimensions: EMBEDDING_DIM,
    }),
  });
  if (!res.ok) throw new Error(`Embedding provider responded ${res.status}`);
  const body = await res.json() as { data?: { embedding: number[] }[] };
  if (!body.data?.length) throw new Error("Embedding provider returned no vectors");
  return body.data.map((row) => row.embedding);
}

export async function embedTexts(texts: string[]): Promise<{ vectors: number[][]; source: string }> {
  if (hasAiProvider()) {
    try {
      return { vectors: await openAiEmbeddings(texts), source: OPENAI_SOURCE };
    } catch (error) {
      logLine("warn", "Embedding provider unavailable, using local hashed embeddings", {
        reason: error instanceof Error ? error.message : "unknown",
      });
    }
  }
  return { vectors: texts.map((text) => hashEmbed(text)), source: LOCAL_SOURCE };
}

export async function embedQuery(query: string): Promise<{ literal: string; source: string }> {
  const { vectors, source } = await embedTexts([query]);
  return { literal: toVectorLiteral(vectors[0]), source };
}

interface StoredEmbedding {
  product_id: string;
  source: string;
  updated_at: string;
}

let lastSync = 0;
let inFlight: Promise<void> | null = null;

/** Backfills embeddings for new/changed products (cheap: only changed rows). */
export async function ensureProductEmbeddings(force = false): Promise<void> {
  if (!force && Date.now() - lastSync < 30_000) return;
  if (inFlight) return inFlight;

  inFlight = (async () => {
    const { data: products } = await dbSelect<ProductRow[]>("products", {
      select: "id,name,description,category,features,is_active,updated_at",
    });
    const { data: stored } = await dbSelect<StoredEmbedding[]>("product_embeddings", {
      select: "product_id,source,updated_at",
    });
    const storedByProduct = new Map(stored.map((row) => [row.product_id, row]));

    const source = embeddingSource();
    const pending = products.filter((product) => {
      const existing = storedByProduct.get(product.id);
      if (!existing) return true;
      if (existing.source !== source) return true;
      return Boolean(product.updated_at) && new Date(existing.updated_at) < new Date(product.updated_at as string);
    });

    for (let i = 0; i < pending.length; i += 16) {
      const batch = pending.slice(i, i + 16);
      const { vectors, source: usedSource } = await embedTexts(batch.map(productToText));
      await Promise.all(batch.map((product, index) =>
        dbUpsert("product_embeddings", {
          product_id: product.id,
          embedding: toVectorLiteral(vectors[index]),
          source: usedSource,
          model: usedSource === LOCAL_SOURCE ? "hashed-bow-trigram-v1" : env.openaiEmbeddingModel,
          updated_at: new Date().toISOString(),
        }, "product_id")
      ));
    }

    lastSync = Date.now();
  })();

  try {
    await inFlight;
  } finally {
    inFlight = null;
  }
}

export async function storeEmbeddingForProduct(product: ProductRow): Promise<void> {
  try {
    const { vectors, source } = await embedTexts([productToText(product)]);
    await dbUpsert("product_embeddings", {
      product_id: product.id,
      embedding: toVectorLiteral(vectors[0]),
      source,
      model: source === LOCAL_SOURCE ? "hashed-bow-trigram-v1" : env.openaiEmbeddingModel,
      updated_at: new Date().toISOString(),
    }, "product_id");
  } catch (error) {
    logLine("warn", "Could not store product embedding", {
      productId: product.id,
      reason: error instanceof Error ? error.message : "unknown",
    });
  }
}
