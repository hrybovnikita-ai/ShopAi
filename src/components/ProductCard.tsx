import { Heart, ShoppingCart, Eye, Scale } from "lucide-react";
import { Link } from "react-router-dom";
import type { CatalogProduct, Product } from "@/types";
import { StarRating } from "./StarRating";
import { useCart } from "@/context/CartContext";
import { useCompare } from "@/context/CompareContext";
import { useToast } from "@/components/Toast";
import { formatCurrency } from "@/lib/format";

interface ProductCardProps {
  product: Product | CatalogProduct;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const { toggle: toggleCompare, isSelected } = useCompare();
  const { push } = useToast();
  const wished = isInWishlist(product.id);
  const comparing = isSelected(product.id);
  const outOfStock = product.stock <= 0;
  const lowStock = !outOfStock && product.stock <= 5;
  const catalog = product as CatalogProduct;
  const reviewCount = typeof catalog.review_count === "number" ? catalog.review_count : undefined;
  // Catalog cards show the rating customers actually gave. Without reviews the
  // score is empty rather than the seeded editorial value.
  const rating = reviewCount === undefined
    ? product.rating
    : reviewCount > 0
      ? catalog.rating_avg
      : null;

  const handleAdd = () => {
    addToCart(product);
    push(`${product.name} added to your cart`, "success");
  };

  const handleWishlist = () => {
    toggleWishlist(product);
    push(
      wished ? `${product.name} removed from your wishlist` : `${product.name} saved to your wishlist`,
      "info",
    );
  };

  return (
    <div className="group glass-dark overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-violet-500/40 hover:shadow-xl hover:shadow-violet-600/15">
      <div className="relative h-56 overflow-hidden">
        <Link to={`/product/${product.id}`} aria-label={`View ${product.name}`}>
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        </Link>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/20 to-transparent" />
        <button
          onClick={handleWishlist}
          aria-label={wished ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          aria-pressed={wished}
          className={`absolute top-3 right-3 rounded-full p-2 backdrop-blur-md transition-all duration-300 ${
            wished
              ? "bg-violet-600/80 text-white"
              : "bg-black/40 text-gray-300 hover:bg-violet-600/60 hover:text-white"
          }`}
        >
          <Heart size={18} className={wished ? "fill-white" : ""} />
        </button>
        <span className="absolute top-3 left-3 rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-violet-200 backdrop-blur-md">
          {product.category}
        </span>
        {outOfStock && (
          <span className="absolute bottom-3 left-3 rounded-full bg-red-500/20 px-3 py-1 text-xs font-semibold text-red-200 ring-1 ring-red-400/40 backdrop-blur-md">
            Out of stock
          </span>
        )}
        {lowStock && (
          <span className="absolute bottom-3 left-3 rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-200 ring-1 ring-amber-400/40 backdrop-blur-md">
            Only {product.stock} left
          </span>
        )}
      </div>

      <div className="p-5">
        {product.brand && (
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-violet-300">
            {product.brand}
          </p>
        )}
        <Link to={`/product/${product.id}`}>
          <h3 className="font-display text-lg font-semibold text-white transition-colors group-hover:text-violet-200">
            {product.name}
          </h3>
        </Link>
        <p className="mt-1 line-clamp-2 text-sm text-gray-400">{product.description}</p>

        <div className="mt-3">
          <StarRating rating={rating} count={reviewCount} />
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="font-display text-2xl font-bold gradient-text">
            {formatCurrency(product.price)}
          </span>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={handleAdd}
            disabled={outOfStock}
            className="btn-primary flex-1 !px-3 !py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ShoppingCart size={16} />
            {outOfStock ? "Unavailable" : "Add to Cart"}
          </button>
          <button
            onClick={handleWishlist}
            aria-label="Add to wishlist"
            className={`btn-secondary !px-3 !py-2.5 ${wished ? "text-violet-400" : ""}`}
          >
            <Heart size={16} className={wished ? "fill-violet-400" : ""} />
          </button>
          <button
            type="button"
            onClick={() => toggleCompare(product)}
            aria-label={comparing ? `Remove ${product.name} from comparison` : `Add ${product.name} to comparison`}
            aria-pressed={comparing}
            className={`btn-secondary !px-3 !py-2.5 ${comparing ? "text-violet-300" : ""}`}
          >
            <Scale size={16} />
          </button>
          <Link
            to={`/product/${product.id}`}
            aria-label="View details"
            className="btn-secondary !px-3 !py-2.5"
          >
            <Eye size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
