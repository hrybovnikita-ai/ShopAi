import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { Product } from "@/types";
import { DISCOUNT_CODES } from "@/data/catalog";

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
  removeFromWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  cartCount: number;
  cartTotal: number;
  discountCode: string | null;
  discountPercent: number;
  discountAmount: number;
  applyDiscountCode: (code: string) => boolean;
  removeDiscountCode: () => void;
}

const CART_KEY = "shopai.cart";
const WISHLIST_KEY = "shopai.wishlist";
const DISCOUNT_KEY = "shopai.discount";

const CartContext = createContext<CartContextValue | undefined>(undefined);

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => loadFromStorage(CART_KEY, []));
  const [wishlist, setWishlist] = useState<Product[]>(() => loadFromStorage(WISHLIST_KEY, []));
  const [discountCode, setDiscountCode] = useState<string | null>(() => loadFromStorage(DISCOUNT_KEY, null));

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    localStorage.setItem(DISCOUNT_KEY, JSON.stringify(discountCode));
  }, [discountCode]);

  const addToCart = (product: Product, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + quantity } : i
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

  const clearCart = () => {
    setItems([]);
    setDiscountCode(null);
  };

  const toggleWishlist = (product: Product) => {
    setWishlist((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      return exists ? prev.filter((p) => p.id !== product.id) : [...prev, product];
    });
  };

  const removeFromWishlist = (productId: string) => {
    setWishlist((prev) => prev.filter((p) => p.id !== productId));
  };

  const isInWishlist = (productId: string) => wishlist.some((p) => p.id === productId);

  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const cartTotal = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  const discountPercent = discountCode ? (DISCOUNT_CODES[discountCode]?.percent ?? 0) : 0;
  const discountAmount = cartTotal * (discountPercent / 100);

  const applyDiscountCode = (code: string): boolean => {
    const upper = code.trim().toUpperCase();
    if (DISCOUNT_CODES[upper]) {
      setDiscountCode(upper);
      return true;
    }
    return false;
  };

  const removeDiscountCode = () => setDiscountCode(null);

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
        removeFromWishlist,
        isInWishlist,
        cartCount,
        cartTotal,
        discountCode,
        discountPercent,
        discountAmount,
        applyDiscountCode,
        removeDiscountCode,
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
