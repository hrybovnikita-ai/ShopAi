import { useEffect, useState } from "react";
import { Check, Star, X } from "lucide-react";
import type { CatalogFacets } from "@/types";
import type { CatalogQuery } from "@/hooks/useCatalog";

interface ProductFiltersProps {
  facets: CatalogFacets | null;
  query: CatalogQuery;
  onChange: (patch: Partial<CatalogQuery>) => void;
  onClear: () => void;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-white/5 pb-5 last:border-0 last:pb-0">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">{title}</h3>
      {children}
    </div>
  );
}

export function ProductFilters({ facets, query, onChange, onClear }: ProductFiltersProps) {
  const [minPrice, setMinPrice] = useState(query.minPrice?.toString() ?? "");
  const [maxPrice, setMaxPrice] = useState(query.maxPrice?.toString() ?? "");

  useEffect(() => {
    setMinPrice(query.minPrice?.toString() ?? "");
    setMaxPrice(query.maxPrice?.toString() ?? "");
  }, [query.minPrice, query.maxPrice]);

  const commitPrice = () => {
    const min = minPrice.trim() === "" ? null : Number(minPrice);
    const max = maxPrice.trim() === "" ? null : Number(maxPrice);
    onChange({
      minPrice: Number.isFinite(min) ? min : null,
      maxPrice: Number.isFinite(max) ? max : null,
      page: 1,
    });
  };

  const hasFilters =
    Boolean(query.q || query.category || query.brand || query.inStock) ||
    query.minPrice != null ||
    query.maxPrice != null ||
    query.rating != null;

  return (
    <div className="glass-dark space-y-5 p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-white">Filters</h2>
        {hasFilters && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 text-xs font-medium text-violet-300 hover:text-violet-200"
          >
            <X size={12} /> Clear all
          </button>
        )}
      </div>

      <Section title="Category">
        <div className="space-y-1">
          <button
            onClick={() => onChange({ category: "", page: 1 })}
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
              query.category === ""
                ? "bg-violet-600/20 text-white"
                : "text-gray-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            All categories
            <span className="text-xs text-gray-500">{facets?.totalActive ?? ""}</span>
          </button>
          {(facets?.categories ?? []).map((category) => {
            const active = query.category.toLowerCase() === category.name.toLowerCase();
            return (
              <button
                key={category.name}
                onClick={() => onChange({ category: active ? "" : category.name, page: 1 })}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-violet-600/20 text-white"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                {category.name}
                <span className="text-xs text-gray-500">{category.count}</span>
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Brand">
        <div className="max-h-44 space-y-1 overflow-y-auto pr-1">
          {(facets?.brands ?? []).map((brand) => {
            const active = query.brand.toLowerCase() === brand.name.toLowerCase();
            return (
              <button
                key={brand.name}
                onClick={() => onChange({ brand: active ? "" : brand.name, page: 1 })}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-violet-600/20 text-white"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                {brand.name}
                <span className="text-xs text-gray-500">{brand.count}</span>
              </button>
            );
          })}
          {(facets?.brands ?? []).length === 0 && (
            <p className="px-3 text-sm text-gray-500">No brands recorded yet.</p>
          )}
        </div>
      </Section>

      <Section title="Price range">
        <div className="flex items-center gap-2">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder={facets ? String(facets.priceRange.min) : "Min"}
            value={minPrice}
            onChange={(event) => setMinPrice(event.target.value)}
            onBlur={commitPrice}
            onKeyDown={(event) => event.key === "Enter" && commitPrice()}
            aria-label="Minimum price"
            className="input-field !py-2 text-sm"
          />
          <span className="text-gray-500">–</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder={facets ? String(facets.priceRange.max) : "Max"}
            value={maxPrice}
            onChange={(event) => setMaxPrice(event.target.value)}
            onBlur={commitPrice}
            onKeyDown={(event) => event.key === "Enter" && commitPrice()}
            aria-label="Maximum price"
            className="input-field !py-2 text-sm"
          />
        </div>
      </Section>

      <Section title="Customer rating">
        <div className="space-y-1">
          {[4, 3, 2].map((value) => {
            const active = query.rating === value;
            return (
              <button
                key={value}
                onClick={() => onChange({ rating: active ? null : value, page: 1 })}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-violet-600/20 text-white"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Star size={14} className="fill-violet-400 text-violet-400" />
                {value}+ stars
              </button>
            );
          })}
          <p className="px-3 pt-1 text-[11px] text-gray-500">Based on published customer reviews only.</p>
        </div>
      </Section>

      <Section title="Availability">
        <button
          onClick={() => onChange({ inStock: !query.inStock, page: 1 })}
          aria-pressed={query.inStock}
          className="flex items-center gap-2 text-sm text-gray-300"
        >
          <span
            className={`flex h-5 w-5 items-center justify-center rounded-md border transition-colors ${
              query.inStock ? "border-violet-500 bg-violet-600 text-white" : "border-white/20 bg-white/5"
            }`}
          >
            {query.inStock && <Check size={13} />}
          </span>
          In stock only
        </button>
      </Section>
    </div>
  );
}
