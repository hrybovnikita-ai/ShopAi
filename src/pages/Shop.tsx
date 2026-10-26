import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  PackageSearch,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { ProductFilters } from "@/components/catalog/ProductFilters";
import { ProductGridSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { EMPTY_QUERY, useCatalog, type CatalogQuery } from "@/hooks/useCatalog";
import { apiRequest } from "@/lib/api";

interface Suggestion {
  type: "product" | "category" | "brand";
  label: string;
  id?: string;
  price?: number;
  image_url?: string;
}

const SORT_OPTIONS = [
  { value: "relevance", label: "Best match" },
  { value: "popular", label: "Most popular" },
  { value: "newest", label: "Newest" },
  { value: "rating", label: "Top rated" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
];

function numericParam(value: string | null): number | null {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const query: CatalogQuery = useMemo(
    () => ({
      ...EMPTY_QUERY,
      q: searchParams.get("q") ?? "",
      category: searchParams.get("category") ?? "",
      brand: searchParams.get("brand") ?? "",
      minPrice: numericParam(searchParams.get("minPrice")),
      maxPrice: numericParam(searchParams.get("maxPrice")),
      rating: numericParam(searchParams.get("rating")),
      inStock: searchParams.get("inStock") === "true",
      sort: searchParams.get("sort") ?? "relevance",
      page: Math.max(1, Math.trunc(numericParam(searchParams.get("page")) ?? 1)),
    }),
    [searchParams],
  );

  const { data, loading, error, refetch } = useCatalog(query);
  const [searchTerm, setSearchTerm] = useState(query.q);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const searchContainer = useRef<HTMLDivElement>(null);

  // Keep the input in sync when the URL changes (back button, filter chips).
  useEffect(() => {
    setSearchTerm(query.q);
  }, [query.q]);

  // Debounced search: the URL is the single source of truth.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.trim() === query.q) return;
      updateQuery({ q: searchTerm.trim(), page: 1 });
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  // Instant suggestions for the search field.
  useEffect(() => {
    if (!suggestOpen || searchTerm.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      apiRequest<{ suggestions: Suggestion[] }>(
        `/catalog/suggest?q=${encodeURIComponent(searchTerm.trim())}`,
        { signal: controller.signal },
      )
        .then((response) => setSuggestions(response.suggestions))
        .catch(() => setSuggestions([]));
    }, 200);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, suggestOpen]);

  function updateQuery(patch: Record<string, string | number | boolean | null | undefined>) {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(patch)) {
      if (value == null || value === "" || value === false) next.delete(key);
      else next.set(key, String(value));
    }
    setSearchParams(next, { replace: true });
  }

  const patchQuery = (patch: Partial<CatalogQuery>) => {
    updateQuery({
      ...patch,
      page: patch.page ?? 1,
      inStock: patch.inStock === undefined ? query.inStock : patch.inStock ? "true" : null,
    });
  };

  const clearFilters = () => setSearchParams(new URLSearchParams(), { replace: true });

  const chooseSuggestion = (suggestion: Suggestion) => {
    setSuggestOpen(false);
    setSuggestions([]);
    if (suggestion.type === "product" && suggestion.id) {
      navigate(`/product/${suggestion.id}`);
    } else if (suggestion.type === "category") {
      updateQuery({ category: suggestion.label, q: null, page: null });
    } else if (suggestion.type === "brand") {
      updateQuery({ brand: suggestion.label, q: null, page: null });
    }
  };

  const activeChips: { label: string; clear: () => void }[] = [];
  if (query.q) activeChips.push({ label: `“${query.q}”`, clear: () => updateQuery({ q: null, page: null }) });
  if (query.category) activeChips.push({ label: query.category, clear: () => updateQuery({ category: null, page: null }) });
  if (query.brand) activeChips.push({ label: query.brand, clear: () => updateQuery({ brand: null, page: null }) });
  if (query.minPrice != null || query.maxPrice != null) {
    activeChips.push({
      label: `$${query.minPrice ?? 0} – ${query.maxPrice != null ? `$${query.maxPrice}` : "any"}`,
      clear: () => updateQuery({ minPrice: null, maxPrice: null, page: null }),
    });
  }
  if (query.rating != null) activeChips.push({ label: `${query.rating}+ stars`, clear: () => updateQuery({ rating: null, page: null }) });
  if (query.inStock) activeChips.push({ label: "In stock", clear: () => updateQuery({ inStock: null, page: null }) });

  const items = data?.items ?? [];
  const showSkeletons = loading && !data;
  const pageCount = data?.pageCount ?? 1;

  return (
    <div className="section-padding">
      <div className="container-max">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs text-violet-200">
              <Sparkles size={13} />
              {data ? `${data.facets.totalActive} live products` : "Live catalog"}
            </div>
            <h1 className="font-display text-3xl font-bold text-white md:text-4xl">Shop the catalog</h1>
            <p className="mt-2 max-w-xl text-sm text-gray-400">
              Filter by category, brand, budget and customer rating. Prices and stock come straight
              from the store database.
            </p>
          </div>
          <Link to="/discover" className="btn-secondary w-fit !py-2.5 text-sm">
            <Sparkles size={16} />
            Try AI search
          </Link>
        </div>

        {/* Search */}
        <div ref={searchContainer} className="relative z-20 mb-6">
          <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => {
              setSearchTerm(event.target.value);
              setSuggestOpen(true);
            }}
            onFocus={() => setSuggestOpen(true)}
            onBlur={() => setTimeout(() => setSuggestOpen(false), 160)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                setSuggestOpen(false);
                updateQuery({ q: searchTerm.trim() || null, page: null });
              }
              if (event.key === "Escape") setSuggestOpen(false);
            }}
            placeholder="Search products, brands or categories…"
            aria-label="Search products"
            className="input-field !py-3.5 pl-11 pr-24"
          />
          <button
            onClick={() => {
              setSuggestOpen(false);
              updateQuery({ q: searchTerm.trim() || null, page: null });
            }}
            className="btn-primary absolute right-2 top-1/2 -translate-y-1/2 !px-4 !py-2 text-sm"
          >
            Search
          </button>

          {suggestOpen && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-white/10 bg-ink-900/95 shadow-2xl shadow-black/50 backdrop-blur-xl animate-fade-in">
              <ul role="listbox" aria-label="Search suggestions">
                {suggestions.map((suggestion) => (
                  <li key={`${suggestion.type}-${suggestion.label}`}>
                    <button
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => chooseSuggestion(suggestion)}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-300 transition-colors hover:bg-violet-600/15 hover:text-white"
                    >
                      {suggestion.type === "product" && suggestion.image_url ? (
                        <img src={suggestion.image_url} alt="" className="h-8 w-8 rounded-lg object-cover" />
                      ) : (
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-violet-300">
                          <Search size={14} />
                        </span>
                      )}
                      <span className="min-w-0 flex-1 truncate">{suggestion.label}</span>
                      <span className="shrink-0 text-[11px] uppercase tracking-wide text-gray-500">
                        {suggestion.type}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Toolbar */}
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowFilters((open) => !open)}
            className="btn-secondary !px-4 !py-2.5 text-sm lg:hidden"
            aria-expanded={showFilters}
            aria-controls="catalog-filters"
          >
            <SlidersHorizontal size={16} />
            Filters
            {activeChips.length > 0 && (
              <span className="ml-1 rounded-full bg-violet-600 px-1.5 text-xs font-bold text-white">
                {activeChips.length}
              </span>
            )}
          </button>

          <p className="text-sm text-gray-400" role="status" aria-live="polite">
            {loading && !data ? "Loading products…" : `${data?.total ?? 0} products found`}
          </p>

          <div className="ml-auto flex items-center gap-2">
            <label htmlFor="catalog-sort" className="text-sm text-gray-500">
              Sort
            </label>
            <select
              id="catalog-sort"
              value={query.sort}
              onChange={(event) => updateQuery({ sort: event.target.value, page: null })}
              className="input-field !w-auto !py-2 text-sm"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value} className="bg-ink-900">
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {activeChips.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {activeChips.map((chip) => (
              <button
                key={chip.label}
                onClick={chip.clear}
                className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-600/15 px-3 py-1.5 text-xs font-medium text-violet-100 transition-colors hover:bg-violet-600/25"
              >
                {chip.label}
                <X size={12} />
              </button>
            ))}
            <button onClick={clearFilters} className="rounded-full px-3 py-1.5 text-xs text-gray-400 hover:text-white">
              Clear all
            </button>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          {/* Filters */}
          <aside
            id="catalog-filters"
            className={`${showFilters ? "block" : "hidden"} lg:block`}
            aria-label="Product filters"
          >
            <div className="lg:sticky lg:top-24">
              <ProductFilters facets={data?.facets ?? null} query={query} onChange={patchQuery} onClear={clearFilters} />
            </div>
          </aside>

          {/* Results */}
          <div>
            {showSkeletons ? (
              <ProductGridSkeleton count={8} />
            ) : error ? (
              <EmptyState
                icon={AlertTriangle}
                title="The catalog didn't load"
                description={error}
                action={
                  <button onClick={refetch} className="btn-primary">
                    Try again
                  </button>
                }
              />
            ) : items.length === 0 ? (
              <EmptyState
                icon={PackageSearch}
                title="No products match those filters"
                description="Try widening the price range, clearing the category, or searching a different keyword."
                action={
                  <button onClick={clearFilters} className="btn-primary">
                    Clear filters
                  </button>
                }
              />
            ) : (
              <>
                <div
                  className={`grid grid-cols-1 gap-6 transition-opacity sm:grid-cols-2 xl:grid-cols-3 ${
                    loading ? "opacity-60" : "opacity-100"
                  }`}
                >
                  {items.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {pageCount > 1 && (
                  <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Catalog pages">
                    <button
                      onClick={() => updateQuery({ page: query.page - 1 })}
                      disabled={query.page <= 1}
                      className="btn-secondary !px-3 !py-2 disabled:opacity-40"
                      aria-label="Previous page"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    {Array.from({ length: pageCount }).map((_, index) => {
                      const page = index + 1;
                      if (pageCount > 7 && Math.abs(page - query.page) > 2 && page !== 1 && page !== pageCount) {
                        return page === 2 || page === pageCount - 1 ? (
                          <span key={page} className="px-1 text-gray-600">…</span>
                        ) : null;
                      }
                      return (
                        <button
                          key={page}
                          onClick={() => updateQuery({ page })}
                          aria-current={page === query.page ? "page" : undefined}
                          className={`h-9 min-w-9 rounded-lg px-3 text-sm font-medium transition-colors ${
                            page === query.page
                              ? "bg-violet-600 text-white"
                              : "glass text-gray-300 hover:text-white"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => updateQuery({ page: query.page + 1 })}
                      disabled={query.page >= pageCount}
                      className="btn-secondary !px-3 !py-2 disabled:opacity-40"
                      aria-label="Next page"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </nav>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
