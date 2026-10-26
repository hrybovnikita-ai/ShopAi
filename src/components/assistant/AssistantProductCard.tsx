import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Loader2, Plus, Scale, Sparkles } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { useCompare } from "@/context/CompareContext";
import { useToast } from "@/components/Toast";
import { StarRating } from "@/components/StarRating";
import { formatCurrency } from "@/lib/format";
import type { AssistantProduct, CatalogProduct, Product, ProductStats } from "@/types";

interface AssistantProductCardProps {
  product: AssistantProduct;
  onAsk: (question: string) => void;
}

const AVAILABILITY: Record<AssistantProduct["availability"], { label: string; className: string }> = {
  in_stock: { label: "In stock", className: "text-emerald-300 bg-emerald-500/10" },
  low_stock: { label: "Low stock", className: "text-amber-300 bg-amber-500/10" },
  out_of_stock: { label: "Out of stock", className: "text-red-300 bg-red-500/10" },
};

/** Compact product card rendered inside an assistant message. */
export function AssistantProductCard({ product, onAsk }: AssistantProductCardProps) {
  const { addToCart } = useCart();
  const { toggle: toggleCompare, isSelected } = useCompare();
  const { push } = useToast();
  const [busy, setBusy] = useState<null | "cart" | "compare">(null);
  const [added, setAdded] = useState(false);
  const availability = AVAILABILITY[product.availability];
  const comparing = isSelected(product.id);

  /** The chat only carries card fields; load the full record before acting. */
  const loadFullProduct = async (): Promise<Product | null> => {
    try {
      const response = await apiRequest<{ product: CatalogProduct; stats: ProductStats }>(
        `/catalog/${product.id}`,
      );
      return response.product;
    } catch (error) {
      push(error instanceof Error ? error.message : "That product could not be loaded.", "error");
      return null;
    }
  };

  const handleAdd = async () => {
    if (product.availability === "out_of_stock" || busy) return;
    setBusy("cart");
    const full = await loadFullProduct();
    setBusy(null);
    if (!full) return;
    addToCart(full);
    setAdded(true);
    push(`${product.name} added to your cart`, "success");
    setTimeout(() => setAdded(false), 1800);
  };

  const handleCompare = async () => {
    if (busy) return;
    setBusy("compare");
    const full = await loadFullProduct();
    setBusy(null);
    if (!full) return;
    toggleCompare(full);
  };

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
      <div className="flex gap-2.5">
        <Link to={product.url} className="h-16 w-16 shrink-0 overflow-hidden rounded-lg">
          <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
        </Link>
        <div className="min-w-0 flex-1">
          <Link to={product.url} className="line-clamp-2 text-sm font-medium text-white hover:text-violet-200">
            {product.name}
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold gradient-text">{formatCurrency(product.price)}</span>
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${availability.className}`}>
              {availability.label}
            </span>
          </div>
          <div className="mt-1">
            <StarRating rating={product.rating_avg} count={product.review_count} size={11} />
          </div>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        <button
          onClick={() => void handleAdd()}
          disabled={product.availability === "out_of_stock" || busy === "cart"}
          className="inline-flex items-center gap-1 rounded-lg bg-violet-600/25 px-2 py-1 text-[11px] font-medium text-violet-100 transition-colors hover:bg-violet-600/40 disabled:opacity-50"
        >
          {busy === "cart" ? (
            <Loader2 size={11} className="animate-spin" />
          ) : added ? (
            <Check size={11} />
          ) : (
            <Plus size={11} />
          )}
          {added ? "Added" : "Add to cart"}
        </button>
        <button
          onClick={() => onAsk(`Find products similar to ${product.name}`)}
          className="inline-flex items-center gap-1 rounded-lg bg-white/5 px-2 py-1 text-[11px] text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
        >
          <Sparkles size={11} />
          Similar
        </button>
        <button
          onClick={() => void handleCompare()}
          disabled={busy === "compare"}
          aria-pressed={comparing}
          className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] transition-colors ${
            comparing ? "bg-violet-600/30 text-violet-100" : "bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white"
          }`}
        >
          {busy === "compare" ? <Loader2 size={11} className="animate-spin" /> : <Scale size={11} />}
          {comparing ? "Comparing" : "Compare"}
        </button>
        <Link
          to={product.url}
          className="inline-flex items-center gap-1 rounded-lg bg-white/5 px-2 py-1 text-[11px] text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
        >
          View
        </Link>
      </div>
    </div>
  );
}
