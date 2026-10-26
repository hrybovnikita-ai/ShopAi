import { useCallback, useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/lib/api";
import type { CatalogResponse } from "@/types";

export interface CatalogQuery {
  q: string;
  category: string;
  brand: string;
  minPrice: number | null;
  maxPrice: number | null;
  rating: number | null;
  inStock: boolean;
  sort: string;
  page: number;
  pageSize: number;
}

export const EMPTY_QUERY: CatalogQuery = {
  q: "",
  category: "",
  brand: "",
  minPrice: null,
  maxPrice: null,
  rating: null,
  inStock: false,
  sort: "relevance",
  page: 1,
  pageSize: 12,
};

function toSearchParams(query: CatalogQuery): string {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.category) params.set("category", query.category);
  if (query.brand) params.set("brand", query.brand);
  if (query.minPrice != null) params.set("minPrice", String(query.minPrice));
  if (query.maxPrice != null) params.set("maxPrice", String(query.maxPrice));
  if (query.rating != null) params.set("rating", String(query.rating));
  if (query.inStock) params.set("inStock", "true");
  if (query.sort) params.set("sort", query.sort);
  params.set("page", String(query.page));
  params.set("pageSize", String(query.pageSize));
  return params.toString();
}

export function useCatalog(query: CatalogQuery) {
  const [data, setData] = useState<CatalogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const key = useMemo(() => toSearchParams(query), [query]);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    setLoading(true);
    setError(null);

    apiRequest<CatalogResponse>(`/catalog?${key}`, { signal: controller.signal })
      .then((response) => {
        if (!cancelled) setData(response);
      })
      .catch((err: unknown) => {
        if (cancelled || (err instanceof DOMException && err.name === "AbortError")) return;
        setError(err instanceof Error ? err.message : "The catalog could not be loaded.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [key, reloadToken]);

  const refetch = useCallback(() => setReloadToken((token) => token + 1), []);

  return { data, loading, error, refetch };
}
