import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Product } from "@/types";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  wishlist: Product[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  toggleWishlist: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
  cartCount: number;
  cartTotal: number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

const CART_KEY = "shopai.cart.v1";
const WISHLIST_KEY = "shopai.wishlist.v1";

function readStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T) : fallback;
  } catch {
    return fallback;
  }
}

function persist(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable (private mode): the in-memory state still works.
  }
}

function mergeProducts(current: Product[], incoming: Product[]): Product[] {
  const byId = new Map(current.map((product) => [product.id, product]));
  for (const product of incoming) {
    if (!byId.has(product.id)) byId.set(product.id, product);
  }
  return [...byId.values()];
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, isDemo } = useAuth();
  const [items, setItems] = useState<CartItem[]>(() => readStored<CartItem[]>(CART_KEY, []));
  const [wishlist, setWishlist] = useState<Product[]>(() => readStored<Product[]>(WISHLIST_KEY, []));

  // A demo account has no JWT, so its wishlist stays local.
  const syncedUserId = user && !isDemo ? user.id : null;

  useEffect(() => {
    persist(CART_KEY, items);
  }, [items]);

  useEffect(() => {
    persist(WISHLIST_KEY, wishlist);
  }, [wishlist]);

  // Signed-in customers get their stored wishlist back, merged with anything
  // they saved locally while signed out.
  useEffect(() => {
    if (!syncedUserId) return;
    let cancelled = false;

    (async () => {
      const { data, error } = await supabase
        .from("wishlists")
        .select("product_id")
        .eq("user_id", syncedUserId)
        .order("created_at", { ascending: false });

      if (error || !data?.length) return;
      const ids = data.map((row) => row.product_id as string);
      const { data: products } = await supabase.from("products").select("*").in("id", ids);
      if (cancelled || !products) return;
      setWishlist((prev) => mergeProducts(prev, products as Product[]));
    })();

    return () => {
      cancelled = true;
    };
  }, [syncedUserId]);

  const addToCart = (product: Product, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        const maxQuantity = Math.max(1, product.stock || existing.quantity + quantity);
        return prev.map((i) =>
          i.product.id === product.id
            ? { ...i, quantity: Math.min(maxQuantity, i.quantity + quantity) }
            : i
        );
      }
      return [...prev, { product, quantity }];
    });
  };

  const removeFromCart = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.product.id === productId ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => setItems([]);

  const toggleWishlist = (product: Product) => {
    const exists = wishlist.some((p) => p.id === product.id);
    setWishlist((prev) =>
      exists ? prev.filter((p) => p.id !== product.id) : [...prev, product]
    );

    if (!syncedUserId) return;

    const query = exists
      ? supabase.from("wishlists").delete().eq("user_id", syncedUserId).eq("product_id", product.id)
      : supabase.from("wishlists").insert({ user_id: syncedUserId, product_id: product.id });

    Promise.resolve(query).then(({ error }) => {
      if (error) console.warn("Wishlist sync failed:", error.message);
    });
  };

  const isInWishlist = (productId: string) => wishlist.some((p) => p.id === productId);

  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const cartTotal = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        wishlist,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        toggleWishlist,
        isInWishlist,
        cartCount,
        cartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
