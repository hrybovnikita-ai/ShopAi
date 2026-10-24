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
