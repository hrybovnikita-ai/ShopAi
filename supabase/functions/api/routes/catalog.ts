/**
 * Public catalog: filtered listing, instant suggestions and product details.
 *
 * Everything is read from the real `products` table; ratings come from
 * `product_review_stats` (published reviews only) and popularity from the
 * aggregate sales view. Nothing here invents prices, stock or ratings.
 */
import { dbSelect } from "../lib/db.ts";
import { HttpError, json } from "../lib/http.ts";
import type { RouteContext } from "../lib/types.ts";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface CatalogProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  brand: string | null;
  stock: number;
  features: string[];
  rating: number;
  is_active: boolean;
  created_at: string;
  rating_avg: number | null;
  review_count: number;
  units_sold: number;
}

interface RawProduct extends Omit<CatalogProduct, "rating_avg" | "review_count" | "units_sold"> {
  rating: number;
}

interface StatsRow {
  product_id: string;
  rating_avg: number | null;
  review_count: number;
  rating_distribution: Record<string, number>;
}

const SORTS = new Set(["relevance", "price_asc", "price_desc", "rating", "newest", "popular"]);

function sanitize(value: string, max = 120): string {
  return value.replace(/[,()*%]/g, " ").trim().slice(0, max);
}

function numberParam(value: string | null): number | null {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function availabilityOf(stock: number): "in_stock" | "low_stock" | "out_of_stock" {
  if (stock <= 0) return "out_of_stock";
  return stock <= 5 ? "low_stock" : "in_stock";
}

export async function loadCatalog(): Promise<{ products: CatalogProduct[]; stats: StatsRow[] }> {
  const [products, stats, popularity] = await Promise.all([
    dbSelect<RawProduct[]>("products", {
      select: "id,name,description,price,image_url,category,brand,stock,features,rating,is_active,created_at",
      is_active: "eq.true",
      order: "created_at.desc",
    }),
    dbSelect<StatsRow[]>("product_review_stats", { select: "*" }),
    dbSelect<{ product_id: string; units_sold: number }[]>("product_popularity", { select: "*" }),
  ]);

  const statsById = new Map(stats.data.map((row) => [row.product_id, row]));
  const soldById = new Map(popularity.data.map((row) => [row.product_id, Number(row.units_sold) || 0]));

  const enriched = products.data.map((product) => {
    const stat = statsById.get(product.id);
    return {
      ...product,
      price: Number(product.price),
      rating: Number(product.rating),
      stock: Number(product.stock),
      features: product.features ?? [],
      rating_avg: stat ? Number(stat.rating_avg) : null,
      review_count: stat ? Number(stat.review_count) : 0,
      units_sold: soldById.get(product.id) ?? 0,
    };
  });

  return { products: enriched, stats: stats.data };
}

export function matchesQuery(product: CatalogProduct, query: string): number {
  const q = query.toLowerCase().trim();
  if (!q) return 1;
  const haystack = `${product.name} ${product.brand ?? ""} ${product.category} ${product.description} ${(product.features ?? []).join(" ")}`.toLowerCase();
  if (haystack.includes(q)) return 3;
  const tokens = q.split(/\s+/).filter((token) => token.length > 1);
  if (tokens.length === 0) return 0;
  let hits = 0;
  for (const token of tokens) {
    if (product.name.toLowerCase().includes(token)) hits += 2;
    else if (haystack.includes(token)) hits += 1;
  }
  return hits === 0 ? 0 : hits / tokens.length;
}

function sortProducts(products: CatalogProduct[], sort: string, query: string): CatalogProduct[] {
  const list = [...products];
  switch (sort) {
    case "price_asc":
      return list.sort((a, b) => a.price - b.price);
    case "price_desc":
      return list.sort((a, b) => b.price - a.price);
    case "rating":
      return list.sort((a, b) => (b.rating_avg ?? 0) - (a.rating_avg ?? 0) || b.review_count - a.review_count);
    case "popular":
      return list.sort((a, b) => b.units_sold - a.units_sold || b.review_count - a.review_count || (b.rating_avg ?? 0) - (a.rating_avg ?? 0));
    case "newest":
      return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    case "relevance":
    default:
      if (!query.trim()) {
        return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      }
      return list
        .map((product) => ({ product, score: matchesQuery(product, query) }))
        .filter((row) => row.score > 0)
        .sort((a, b) => b.score - a.score || (b.product.rating_avg ?? 0) - (a.product.rating_avg ?? 0))
        .map((row) => row.product);
  }
}

export async function handleCatalog({ url }: RouteContext): Promise<Response> {
  const query = sanitize(url.searchParams.get("q") ?? "");
  const category = sanitize(url.searchParams.get("category") ?? "");
  const brand = sanitize(url.searchParams.get("brand") ?? "");
  const minPrice = numberParam(url.searchParams.get("minPrice"));
  const maxPrice = numberParam(url.searchParams.get("maxPrice"));
  const minRating = numberParam(url.searchParams.get("rating"));
  const inStockOnly = url.searchParams.get("inStock") === "true";
  const sortParam = url.searchParams.get("sort") ?? "relevance";
  const sort = SORTS.has(sortParam) ? sortParam : "relevance";
  const page = Math.max(1, Math.trunc(numberParam(url.searchParams.get("page")) ?? 1));
  const pageSize = Math.min(48, Math.max(1, Math.trunc(numberParam(url.searchParams.get("pageSize")) ?? 12)));

  const { products } = await loadCatalog();

  const filtered = products.filter((product) => {
    if (category && product.category.toLowerCase() !== category.toLowerCase()) return false;
    if (brand && (product.brand ?? "").toLowerCase() !== brand.toLowerCase()) return false;
    if (minPrice != null && product.price < minPrice) return false;
    if (maxPrice != null && product.price > maxPrice) return false;
    if (minRating != null && (product.rating_avg ?? 0) < minRating) return false;
    if (inStockOnly && product.stock <= 0) return false;
    if (query && matchesQuery(product, query) === 0) return false;
    return true;
  });

  const sorted = sortProducts(filtered, sort, query);
  const total = sorted.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pageCount);
  const from = (safePage - 1) * pageSize;

  const categoryCounts = new Map<string, number>();
  const brandCounts = new Map<string, number>();
  for (const product of products) {
    categoryCounts.set(product.category, (categoryCounts.get(product.category) ?? 0) + 1);
    if (product.brand) brandCounts.set(product.brand, (brandCounts.get(product.brand) ?? 0) + 1);
  }

  return json({
    items: sorted.slice(from, from + pageSize),
    total,
    page: safePage,
    pageSize,
    pageCount,
    facets: {
      categories: [...categoryCounts.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => a.name.localeCompare(b.name)),
      brands: [...brandCounts.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => a.name.localeCompare(b.name)),
      priceRange: products.length
        ? {
            min: Math.floor(Math.min(...products.map((product) => product.price))),
            max: Math.ceil(Math.max(...products.map((product) => product.price))),
          }
        : { min: 0, max: 0 },
      totalActive: products.length,
      inStock: products.filter((product) => product.stock > 0).length,
    },
  });
}

export async function handleCatalogSuggest({ url }: RouteContext): Promise<Response> {
  const query = sanitize(url.searchParams.get("q") ?? "", 60);
  if (query.length < 2) return json({ suggestions: [] });

  const { products } = await loadCatalog();
  const suggestions: { type: "product" | "category" | "brand"; label: string; id?: string; image_url?: string; price?: number }[] = [];

  const seenCategories = new Set<string>();
  const seenBrands = new Set<string>();
  for (const product of products) {
    const lower = query.toLowerCase();
    if (product.category.toLowerCase().includes(lower) && !seenCategories.has(product.category)) {
      seenCategories.add(product.category);
      suggestions.push({ type: "category", label: product.category });
    }
    if (product.brand && product.brand.toLowerCase().includes(lower) && !seenBrands.has(product.brand)) {
      seenBrands.add(product.brand);
      suggestions.push({ type: "brand", label: product.brand });
    }
  }

  const matchingProducts = products
    .map((product) => ({ product, score: matchesQuery(product, query) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  for (const { product } of matchingProducts) {
    suggestions.push({
      type: "product",
      label: product.name,
      id: product.id,
      image_url: product.image_url,
      price: product.price,
    });
  }

  return json({ suggestions: suggestions.slice(0, 8) });
}

export async function handleCatalogProduct({ params }: RouteContext): Promise<Response> {
  const id = params.id;
  if (!UUID_RE.test(id)) throw new HttpError(400, "Invalid product id", "invalid_id");

  const { products, stats } = await loadCatalog();
  const product = products.find((item) => item.id === id);
  if (!product) throw new HttpError(404, "This product is no longer available", "product_not_found");

  const stat = stats.find((row) => row.product_id === id);
  const related = products
    .filter((item) => item.id !== id && item.category === product.category)
    .sort((a, b) => (b.rating_avg ?? 0) - (a.rating_avg ?? 0))
    .slice(0, 4);

  return json({
    product,
    stats: {
      rating_avg: product.rating_avg,
      review_count: product.review_count,
      distribution: stat?.rating_distribution ?? { "5": 0, "4": 0, "3": 0, "2": 0, "1": 0 },
    },
    related,
  });
}
