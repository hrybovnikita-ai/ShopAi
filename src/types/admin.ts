import type { Product } from "@/types";

export interface AdminSession {
  authenticated: boolean;
  isAdmin: boolean;
  user: { id: string; email: string | null } | null;
}

export interface AdminProduct extends Product {
  is_active: boolean;
  updated_at?: string;
}

export interface AdminOrderItem {
  id: string;
  product_id: string | null;
  name: string;
  unit_price: number;
  quantity: number;
}

export type OrderStatus = "pending" | "paid" | "shipped" | "delivered" | "cancelled";

export interface AdminOrder {
  id: string;
  customer_name: string;
  customer_email: string;
  status: OrderStatus;
  total: number;
  tax: number;
  item_count: number;
  created_at: string;
  order_items?: AdminOrderItem[];
}

export interface AdminCustomer {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  order_count: number;
  lifetime_value: number;
}

export interface AdminCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  created_at: string;
  productCount?: number;
}

export interface AdminStats {
  products: number;
  activeProducts: number;
  lowStock: number;
  outOfStock: number;
  categories: number;
  orders: number;
  pendingOrders: number;
  revenue: number;
  avgOrderValue: number;
  customers: number;
  recentOrders: AdminOrder[];
  topProducts: { name: string; units: number; revenue: number }[];
  lowStockProducts: { id: string; name: string; stock: number }[];
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface MonitorOverview {
  windowHours: number;
  totalRequests: number;
  failedRequests: number;
  p50Ms: number;
  p95Ms: number;
  avgMs: number;
  byStatus: Record<string, number>;
  byPath: { path: string; count: number; errors: number; avgMs: number }[];
  timeline: { bucket: string; count: number; errors: number; avgMs: number }[];
}

export interface MonitorErrorEntry {
  id: number;
  level: "error" | "warning";
  message: string;
  path: string;
  method: string;
  status: number | null;
  code: string | null;
  created_at: string;
}

export interface MonitorRequestEntry {
  id: number;
  method: string;
  path: string;
  status: number;
  duration_ms: number;
  created_at: string;
}

export interface HealthStatus {
  status: "ok" | "degraded";
  service: string;
  environment: string;
  uptimeSeconds: number;
  timestamp: string;
  database: { ok: boolean; latencyMs: number; error: string | null };
  ai: { configured: boolean; embeddings: string };
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

export interface ComparisonResult {
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

export interface SemanticResult extends Product {
  similarity: number;
  lexicalScore: number;
  score: number;
  matchedKeywords?: string[];
  reason: string;
}

export interface SemanticSearchResponse {
  query: string;
  mode: "ai-embeddings" | "local-embeddings";
  notice: string;
  interpreted: { maxPrice: number | null; category: string | null; keywords: string[] };
  total: number;
  results: SemanticResult[];
  suggestions: Product[];
}
