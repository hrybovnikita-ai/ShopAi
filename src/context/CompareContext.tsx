import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import type { Product } from "@/types";
import { useToast } from "@/components/Toast";

export const MAX_COMPARE = 4;

interface CompareContextValue {
  selection: Product[];
  isSelected: (productId: string) => boolean;
  toggle: (product: Product) => void;
  remove: (productId: string) => void;
  clear: () => void;
  isFull: boolean;
}

const CompareContext = createContext<CompareContextValue | undefined>(undefined);

export function CompareProvider({ children }: { children: ReactNode }) {
  const [selection, setSelection] = useState<Product[]>([]);
  const { push } = useToast();

  const isSelected = useCallback(
    (productId: string) => selection.some((product) => product.id === productId),
    [selection],
  );

  const toggle = useCallback((product: Product) => {
    setSelection((prev) => {
      if (prev.some((item) => item.id === product.id)) {
        return prev.filter((item) => item.id !== product.id);
      }
      if (prev.length >= MAX_COMPARE) {
        push(`You can compare up to ${MAX_COMPARE} products. Remove one first.`, "info");
        return prev;
      }
      return [...prev, product];
    });
  }, [push]);

  const remove = useCallback((productId: string) => {
    setSelection((prev) => prev.filter((product) => product.id !== productId));
  }, []);

  const clear = useCallback(() => setSelection([]), []);

  return (
    <CompareContext.Provider
      value={{ selection, isSelected, toggle, remove, clear, isFull: selection.length >= MAX_COMPARE }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used within CompareProvider");
  return ctx;
}
