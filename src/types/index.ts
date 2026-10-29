export interface Product {
  id: string;
  name: string;
  brand: string;
  description: string;
  price: number;
  /** Original price before discount; when present and > price, a discount badge is shown. */
  original_price?: number | null;
  image_url: string;
  /** Additional gallery images for the product detail page. */
  gallery?: string[] | null;
  specs?: Record<string, string> | null;
  rating: number;
  category: string;
  stock: number;
  features: string[];
  created_at: string;
  /** Added by the administrator backend; absent on older records. */
  is_active?: boolean;
  updated_at?: string;
}

export interface Review {
  id: string;
  product_id: string;
  author: string;
  rating: number;
  comment: string;
  created_at: string;
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
