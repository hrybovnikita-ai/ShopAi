import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, Search, Sparkles, Wand2, Database, ArrowRight } from "lucide-react";
import { apiRequest } from "@/lib/api";
import type { SemanticSearchResponse } from "@/types/admin";
import { ProductCard } from "@/components/ProductCard";
import { Badge, Skeleton } from "@/components/admin/ui";

const EXAMPLES = [
  "Find me a gaming laptop under $1200",
  "I need a smartphone with a great camera",
  "Show me affordable accessories for programming",
  "Find a lightweight laptop for university",
];

export function SemanticSearch() {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState<SemanticSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runSearch = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || loading) return;

    setQuery(trimmed);
    setLoading(true);
    setError(null);

    try {
      const result = await apiRequest<SemanticSearchResponse>("/search/semantic", {
        method: "POST",
        body: { query: trimmed, limit: 8 },
      });
      setResponse(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search is unavailable right now");
      setResponse(null);
    } finally {
      setLoading(false);
    }
  };

  const interpreted = response?.interpreted;

  return (
    <div className="section-padding">
      <div className="container-max">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-sm text-violet-200">
            <Sparkles size={14} />
            AI Product Discovery
          </div>
          <h1 className="mt-4 font-display text-3xl font-bold text-white sm:text-4xl">
            Describe what you need. <span className="gradient-text">We find the match.</span>
          </h1>
          <p className="mt-3 text-sm text-gray-400 sm:text-base">
            Natural-language search over the live ShopAi catalog, ranked with product embeddings stored in
            PostgreSQL and pgvector.
          </p>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void runSearch(query);
            }}
            className="mt-6 flex flex-col gap-2 sm:flex-row"
          >
            <div className="relative flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                aria-label="Describe the product you need"
                placeholder="e.g. a gaming laptop under $1200"
                className="input-field !py-3.5 pl-11 text-sm sm:text-base"
              />
            </div>
            <button type="submit" className="btn-primary !py-3.5 text-sm sm:text-base" disabled={loading || !query.trim()}>
              <Wand2 size={18} />
              {loading ? "Searching…" : "Find products"}
            </button>
          </form>

          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {EXAMPLES.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => void runSearch(example)}
                className="rounded-full bg-white/5 px-3 py-1.5 text-xs text-violet-200 transition hover:bg-violet-600/20"
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mx-auto mt-8 flex max-w-2xl items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {loading && (
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, index) => (
              <Skeleton key={index} className="h-96" />
            ))}
          </div>
        )}

        {!loading && response && (
          <div className="mt-10">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={response.mode === "ai-embeddings" ? "violet" : "neutral"}>
                  <Database size={12} />
                  {response.mode === "ai-embeddings" ? "AI embeddings" : "Local embeddings (pgvector)"}
                </Badge>
                {interpreted?.maxPrice != null && <Badge tone="success">Under ${interpreted.maxPrice}</Badge>}
                {interpreted?.category && <Badge tone="violet">{interpreted.category}</Badge>}
                <span className="text-xs text-gray-500">{response.total} results</span>
              </div>
              <p className="max-w-xl text-xs text-gray-500">{response.notice}</p>
            </div>

            {response.results.length === 0 ? (
              <div className="glass-dark p-8 text-center">
                <p className="font-display text-lg font-semibold text-white">No products matched that description</p>
                <p className="mt-2 text-sm text-gray-400">Try removing the budget limit or using a different category.</p>
                {response.suggestions.length > 0 && (
                  <div className="mt-6">
                    <p className="mb-3 text-xs uppercase tracking-wide text-gray-500">Top rated instead</p>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {response.suggestions.map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {response.results.map((product) => (
                  <div key={product.id} className="flex flex-col gap-2">
                    <ProductCard product={product} />
                    <p className="px-1 text-xs leading-relaxed text-gray-500">
                      <span className="text-violet-300">{Math.round(product.score * 100)}% match</span> · {product.reason}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!loading && !response && !error && (
          <div className="mx-auto mt-12 max-w-2xl">
            <div className="glass-dark p-6">
              <h2 className="font-display text-lg font-semibold text-white">How it works</h2>
              <ul className="mt-3 space-y-2 text-sm text-gray-400">
                <li className="flex gap-2">
                  <span className="text-violet-300">1.</span>
                  Your sentence is turned into a 1536-dimension vector on the server.
                </li>
                <li className="flex gap-2">
                  <span className="text-violet-300">2.</span>
                  PostgreSQL pgvector ranks products by cosine similarity, combined with keyword signals.
                </li>
                <li className="flex gap-2">
                  <span className="text-violet-300">3.</span>
                  Budget limits and categories are extracted from the sentence and applied as filters.
                </li>
              </ul>
              <Link to="/compare" className="mt-4 inline-flex items-center gap-1 text-sm text-violet-300 hover:text-violet-200">
                Or compare products side by side
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
