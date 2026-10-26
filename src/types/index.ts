export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  rating: number;
  category: string;
  stock: number;
  features: string[];
  created_at: string;
  /** Added by the administrator backend; absent on older records. */
  is_active?: boolean;
  updated_at?: string;
  /** Manufacturer/brand, when known. Never inferred on the client. */
  brand?: string | null;
}

/** A catalog row enriched with the aggregates computed by the API. */
export interface CatalogProduct extends Product {
  brand: string | null;
  rating_avg: number | null;
  review_count: number;
  units_sold: number;
}

export interface CatalogFacets {
  categories: { name: string; count: number }[];
  brands: { name: string; count: number }[];
  priceRange: { min: number; max: number };
  totalActive: number;
  inStock: number;
}

export interface CatalogResponse {
  items: CatalogProduct[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  facets: CatalogFacets;
}

export interface ProductStats {
  rating_avg: number | null;
  review_count: number;
  distribution: Record<string, number>;
}

export interface ProductReview {
  id: string;
  product_id: string;
  user_id: string;
  author_name: string;
  rating: number;
  title: string;
  body: string;
  images: string[];
  verified_purchase: boolean;
  status: "published" | "hidden";
  created_at: string;
  updated_at: string;
}

export interface AssistantProduct {
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

export interface AssistantReply {
  configured: boolean;
  mode: "ai" | "catalog";
  reply: string;
  setupHint: string | null;
  products: AssistantProduct[];
  suggestions: string[];
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface PricingPlan {
  id: string;
  name: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  highlighted: boolean;
}
