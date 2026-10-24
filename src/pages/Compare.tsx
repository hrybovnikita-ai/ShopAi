import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  Check,
  CircleDot,
  Loader2,
  Plus,
  Scale,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  X,
} from "lucide-react";
import { apiRequest } from "@/lib/api";
import { useCompare, MAX_COMPARE } from "@/context/CompareContext";
import { useProducts } from "@/hooks/useProducts";
import type { ComparisonResult } from "@/types/admin";
import { formatCurrency } from "@/lib/format";
import { Badge, EmptyState, Skeleton } from "@/components/admin/ui";

export function Compare() {
  const { selection, toggle, remove, clear, isSelected } = useCompare();
  const { products, loading: productsLoading } = useProducts();
  const [requirements, setRequirements] = useState("");
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const analysisById = useMemo(
    () => new Map((result?.products ?? []).map((product) => [product.id, product])),
    [result],
  );

  const winnerLabel = (id: string | null) => {
    if (!id || !result) return null;
    if (result.winners.bestOverall === id) return "Best overall";
    if (result.winners.bestForRequirements === id) return "Best fit";
    if (result.winners.bestValue === id) return "Best value";
    return null;
  };

  const analyze = async () => {
    if (selection.length < 2 || loading) return;
    setLoading(true);
    setError(null);

    try {
      const data = await apiRequest<ComparisonResult>("/ai/compare", {
        method: "POST",
        body: { productIds: selection.map((product) => product.id), requirements },
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The comparison service is unavailable");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const available = products.filter((product) => !isSelected(product.id));

  return (
    <div className="section-padding">
      <div className="container-max">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-sm text-violet-200">
              <Scale size={14} />
              AI Product Comparison
            </div>
            <h1 className="mt-3 font-display text-3xl font-bold text-white sm:text-4xl">
              Compare up to four products
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-gray-400">
              Side-by-side specifications with advantages, disadvantages and best use cases. When no AI
              provider is configured, the analysis is generated from stored specifications and labelled
              as rule-based.
            </p>
          </div>
          {selection.length > 0 && (
            <button type="button" onClick={clear} className="btn-ghost self-start text-sm">
              <Trash2 size={15} />
              Clear selection
            </button>
          )}
        </div>

        {selection.length === 0 ? (
          <EmptyState
            icon={Scale}
            title="No products selected yet"
            description="Add products from the catalog below, or use the compare button on any product card."
            action={
              <Link to="/discover" className="btn-secondary !py-2.5 text-sm">
                Discover products
                <ArrowRight size={15} />
              </Link>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {selection.map((product) => {
              const analysis = analysisById.get(product.id);
              const winner = winnerLabel(product.id);
              return (
                <div key={product.id} className="glass-dark overflow-hidden">
                  <div className="relative h-36">
                    <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-transparent to-transparent" />
                    <button
                      type="button"
                      onClick={() => remove(product.id)}
                      aria-label={`Remove ${product.name} from comparison`}
                      className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-gray-200 backdrop-blur transition hover:bg-red-600/70 hover:text-white"
                    >
                      <X size={14} />
                    </button>
                    {winner && (
                      <span className="absolute left-2 top-2">
                        <Badge tone="violet">
                          <Sparkles size={11} />
                          {winner}
                        </Badge>
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="line-clamp-2 font-display text-sm font-semibold text-white">{product.name}</p>
                    <p className="mt-1 text-xs text-gray-500">{product.category}</p>
                    <p className="mt-2 text-lg font-bold gradient-text">{formatCurrency(product.price)}</p>
                    {analysis && (
                      <div className="mt-3 space-y-2">
                        <div>
                          <div className="flex justify-between text-[11px] text-gray-500">
                            <span>Overall score</span>
                            <span>{analysis.score}/100</span>
                          </div>
                          <div className="mt-1 h-1.5 rounded-full bg-white/5">
                            <div className="h-full rounded-full gradient-bg" style={{ width: `${analysis.score}%` }} />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-[11px] text-gray-500">
                            <span>Requirements fit</span>
                            <span>{analysis.suitability}%</span>
                          </div>
                          <div className="mt-1 h-1.5 rounded-full bg-white/5">
                            <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400" style={{ width: `${analysis.suitability}%` }} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {selection.length < MAX_COMPARE && (
              <button
                type="button"
                onClick={() => setPickerOpen((open) => !open)}
                className="glass-dark flex min-h-[220px] flex-col items-center justify-center gap-2 border-dashed text-sm text-gray-400 transition hover:border-violet-500/40 hover:text-white"
              >
                <Plus size={22} />
                Add a product
                <span className="text-xs text-gray-500">{selection.length}/{MAX_COMPARE} selected</span>
              </button>
            )}
          </div>
        )}

        {pickerOpen && (
          <section className="glass-dark mt-6 p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-white">Add from the catalog</h2>
              <button type="button" onClick={() => setPickerOpen(false)} className="btn-ghost text-sm">
                Close
              </button>
            </div>
            {productsLoading ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {[...Array(4)].map((_, index) => (
                  <Skeleton key={index} className="h-14" />
                ))}
              </div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {available.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => toggle(product)}
                    className="flex items-center justify-between gap-3 rounded-xl bg-white/5 px-3 py-2.5 text-left text-sm transition hover:bg-violet-600/15"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-gray-200">{product.name}</span>
                      <span className="text-xs text-gray-500">{product.category}</span>
                    </span>
                    <span className="shrink-0 text-xs text-violet-200">{formatCurrency(product.price)}</span>
                  </button>
                ))}
                {available.length === 0 && <p className="text-sm text-gray-500">Every catalog product is already selected.</p>}
              </div>
            )}
          </section>
        )}

        {selection.length > 0 && (
          <div className="glass-dark mt-6 p-5">
            <label htmlFor="compare-requirements" className="mb-2 block text-sm font-medium text-gray-300">
              What do you need it for? <span className="font-normal text-gray-500">(optional)</span>
            </label>
            <textarea
              id="compare-requirements"
              rows={2}
              value={requirements}
              onChange={(event) => setRequirements(event.target.value)}
              placeholder="e.g. university coursework, occasional gaming, long battery life, budget under $1200"
              className="input-field resize-y"
            />
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => void analyze()}
                disabled={selection.length < 2 || loading}
                className="btn-primary !py-2.5 text-sm disabled:opacity-50"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                {loading ? "Comparing…" : "Generate comparison"}
              </button>
              {selection.length < 2 && (
                <p className="text-xs text-amber-300">Select at least two products to compare.</p>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
            <p className="flex items-center gap-2 font-medium">
              <AlertCircle size={16} />
              Comparison service unavailable
            </p>
            <p className="mt-1 text-amber-200/90">
              {error} The specifications below come straight from the stored catalog — no AI analysis was
              generated.
            </p>
          </div>
        )}

        {loading && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(Math.min(4, Math.max(2, selection.length)))].map((_, index) => (
              <Skeleton key={index} className="h-64" />
            ))}
          </div>
        )}

        {!loading && result && (
          <section className="mt-8">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <Badge tone={result.mode === "ai" ? "violet" : "neutral"}>
                {result.mode === "ai" ? <Sparkles size={12} /> : <CircleDot size={12} />}
                {result.mode === "ai" ? `AI generated · ${result.provider}` : "Rule-based comparison"}
              </Badge>
              <p className="text-xs text-gray-500">{result.notice}</p>
            </div>

            <div className="glass-dark p-5">
              <h2 className="font-display text-lg font-semibold text-white">Summary</h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-300">{result.summary}</p>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {result.products.map((product) => (
                <article key={product.id} className="glass-dark flex flex-col p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display text-sm font-semibold text-white">{product.name}</h3>
                    <span className="shrink-0 rounded-lg bg-violet-600/20 px-2 py-1 text-xs font-semibold text-violet-200">
                      {product.score}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {product.category} · {formatCurrency(product.price)} · {product.rating}/5
                  </p>

                  <div className="mt-3 space-y-1.5">
                    {product.pros.map((pro) => (
                      <p key={pro} className="flex gap-1.5 text-xs text-emerald-200">
                        <ThumbsUp size={12} className="mt-0.5 shrink-0" />
                        {pro}
                      </p>
                    ))}
                    {product.cons.map((con) => (
                      <p key={con} className="flex gap-1.5 text-xs text-amber-200">
                        <ThumbsDown size={12} className="mt-0.5 shrink-0" />
                        {con}
                      </p>
                    ))}
                  </div>

                  <div className="mt-3 border-t border-white/10 pt-3 text-xs">
                    <p className="text-gray-500">Best for</p>
                    <p className="text-gray-200">{product.bestFor}</p>
                    <p className="mt-2 leading-relaxed text-gray-400">{product.verdict}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {selection.length >= 2 && (
          <section className="glass-dark mt-8 overflow-hidden">
            <div className="border-b border-white/10 p-5">
              <h2 className="font-display text-lg font-semibold text-white">Specification comparison</h2>
              <p className="mt-1 text-xs text-gray-500">Values read directly from the product records.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Specification</th>
                    {selection.map((product) => (
                      <th key={product.id} className="px-4 py-3 font-medium text-gray-300">
                        {product.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <tr>
                    <td className="px-4 py-3 text-gray-500">Price</td>
                    {selection.map((product) => (
                      <td key={product.id} className="px-4 py-3 font-medium text-white">
                        {formatCurrency(product.price)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-gray-500">Rating</td>
                    {selection.map((product) => (
                      <td key={product.id} className="px-4 py-3 text-gray-200">
                        {product.rating.toFixed(1)} ★
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-gray-500">Category</td>
                    {selection.map((product) => (
                      <td key={product.id} className="px-4 py-3 text-gray-200">
                        {product.category}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-gray-500">Availability</td>
                    {selection.map((product) => (
                      <td key={product.id} className="px-4 py-3">
                        <Badge tone={product.stock === 0 ? "danger" : product.stock <= 5 ? "warning" : "success"}>
                          {product.stock === 0 ? "Out of stock" : `${product.stock} in stock`}
                        </Badge>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-gray-500">Key features</td>
                    {selection.map((product) => (
                      <td key={product.id} className="px-4 py-3">
                        <ul className="space-y-1 text-xs text-gray-300">
                          {(product.features ?? []).map((feature) => (
                            <li key={feature} className="flex gap-1.5">
                              <Check size={12} className="mt-0.5 shrink-0 text-violet-300" />
                              {feature}
                            </li>
                          ))}
                          {(product.features ?? []).length === 0 && <li className="text-gray-500">No features recorded</li>}
                        </ul>
                      </td>
                    ))}
                  </tr>
                  {result && (
                    <>
                      <tr>
                        <td className="px-4 py-3 text-gray-500">Overall score</td>
                        {selection.map((product) => (
                          <td key={product.id} className="px-4 py-3 text-gray-200">
                            {analysisById.get(product.id)?.score ?? "—"}/100
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-gray-500">Requirements fit</td>
                        {selection.map((product) => (
                          <td key={product.id} className="px-4 py-3 text-gray-200">
                            {analysisById.get(product.id)?.suitability ?? "—"}%
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-gray-500">Best use case</td>
                        {selection.map((product) => (
                          <td key={product.id} className="px-4 py-3 text-gray-200">
                            {analysisById.get(product.id)?.bestFor ?? "—"}
                          </td>
                        ))}
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
