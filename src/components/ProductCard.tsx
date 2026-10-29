import { Heart, ShoppingCart, Eye, Scale, Zap } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import type { Product } from "@/types";
import { StarRating } from "./StarRating";
import { useCart } from "@/context/CartContext";
import { useCompare } from "@/context/CompareContext";
import { useToast } from "@/components/Toast";

interface ProductCardProps {
  product: Product;
}

function discountPercent(product: Product): number | null {
  if (product.original_price && product.original_price > product.price) {
    return Math.round(((product.original_price - product.price) / product.original_price) * 100);
  }
  return null;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const { toggle: toggleCompare, isSelected } = useCompare();
  const { push } = useToast();
  const navigate = useNavigate();
  const wished = isInWishlist(product.id);
  const comparing = isSelected(product.id);
  const discount = discountPercent(product);
  const outOfStock = product.stock === 0;

  const handleBuyNow = () => {
    if (outOfStock) {
      push("This product is out of stock", "error");
      return;
    }
    addToCart(product);
    navigate("/checkout");
  };

  return (
    <div className="group glass-dark overflow-hidden transition-all duration-300 hover:border-violet-500/40 hover:shadow-xl hover:shadow-violet-600/10">
      <div className="relative h-56 overflow-hidden">
        <img
          src={product.image_url}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-transparent to-transparent" />

        {/* Discount badge */}
        {discount && (
          <span className="absolute top-3 left-3 rounded-full bg-gradient-to-r from-violet-600 to-blue-600 px-3 py-1 text-xs font-bold text-white shadow-lg shadow-violet-600/30">
            -{discount}%
          </span>
        )}
        {!discount && (
          <span className="absolute top-3 left-3 rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-violet-200 backdrop-blur-md">
            {product.category}
          </span>
        )}

        {/* Out of stock overlay */}
        {outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink-950/60">
            <span className="rounded-full bg-red-600/80 px-4 py-2 text-sm font-semibold text-white">
              Out of Stock
            </span>
          </div>
        )}

        {/* Wishlist button */}
        <button
          onClick={() => toggleWishlist(product)}
          aria-label="Toggle wishlist"
          className={`absolute top-3 right-3 rounded-full p-2 backdrop-blur-md transition-all duration-300 ${
            wished
              ? "bg-violet-600/80 text-white"
              : "bg-black/40 text-gray-300 hover:bg-violet-600/60 hover:text-white"
          }`}
        >
          <Heart size={18} className={wished ? "fill-white" : ""} />
        </button>
      </div>

      <div className="p-5">
        <p className="text-xs font-medium text-violet-400 uppercase tracking-wide">{product.brand}</p>
        <h3 className="mt-1 font-display text-lg font-semibold text-white">{product.name}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-gray-400">{product.description}</p>

        <div className="mt-3">
          <StarRating rating={product.rating} />
        </div>

        <div className="mt-4 flex items-center gap-2">
          <span className="text-2xl font-bold gradient-text">
            ${product.price.toFixed(2)}
          </span>
          {discount && (
            <span className="text-sm text-gray-500 line-through">
              ${product.original_price!.toFixed(2)}
            </span>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={() => addToCart(product)}
            disabled={outOfStock}
            className="btn-primary flex-1 !px-3 !py-2.5 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ShoppingCart size={16} />
            Add to Cart
          </button>
          <button
            onClick={handleBuyNow}
            disabled={outOfStock}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-500 to-blue-500 px-3 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition-all duration-300 hover:scale-[1.02] hover:shadow-violet-600/40 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Buy now"
          >
            <Zap size={16} />
            Buy Now
          </button>
        </div>

        <div className="mt-2 flex gap-2">
          <button
            onClick={() => toggleWishlist(product)}
            aria-label="Add to wishlist"
            className={`btn-secondary flex-1 !px-3 !py-2 ${wished ? "text-violet-400" : ""}`}
          >
            <Heart size={14} className={wished ? "fill-violet-400" : ""} />
            Wishlist
          </button>
          <button
            type="button"
            onClick={() => toggleCompare(product)}
            aria-label={comparing ? `Remove ${product.name} from comparison` : `Add ${product.name} to comparison`}
            aria-pressed={comparing}
            className={`btn-secondary !px-3 !py-2 ${comparing ? "text-violet-300" : ""}`}
          >
            <Scale size={14} />
          </button>
          <Link
            to={`/product/${product.id}`}
            aria-label="View details"
            className="btn-secondary !px-3 !py-2"
          >
            <Eye size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
