import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { FALLBACK_PRODUCTS } from "@/data/catalog";
import type { Product } from "@/types";

export function useProducts() {
  const [products, setProducts] = useState<Product[]>(FALLBACK_PRODUCTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchProducts() {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .order("created_at", { ascending: false });

        if (cancelled) return;

        if (error) {
          setError(error.message);
          setProducts(FALLBACK_PRODUCTS);
        } else if (data && data.length > 0) {
          setProducts(data as Product[]);
        } else {
          setProducts(FALLBACK_PRODUCTS);
        }
      } catch {
        if (!cancelled) {
          setError("Unable to load products from database");
          setProducts(FALLBACK_PRODUCTS);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchProducts();
    return () => {
      cancelled = true;
    };
  }, []);

  return { products, loading, error };
}
