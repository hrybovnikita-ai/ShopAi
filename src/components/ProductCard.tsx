import { Heart, ShoppingCart, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import type { Product } from "@/types";
import { StarRating } from "./StarRating";
import { useCart } from "@/context/CartContext";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const wished = isInWishlist(product.id);

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
        <span className="absolute top-3 left-3 rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-violet-200 backdrop-blur-md">
          {product.category}
        </span>
      </div>

      <div className="p-5">
        <h3 className="font-display text-lg font-semibold text-white">{product.name}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-gray-400">{product.description}</p>

        <div className="mt-3">
          <StarRating rating={product.rating} />
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-2xl font-bold gradient-text">
            ${product.price.toFixed(2)}
          </span>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={() => addToCart(product)}
            className="btn-primary flex-1 !px-3 !py-2.5 text-sm"
          >
            <ShoppingCart size={16} />
            Add to Cart
          </button>
          <button
            onClick={() => toggleWishlist(product)}
            aria-label="Add to wishlist"
            className={`btn-secondary !px-3 !py-2.5 ${wished ? "text-violet-400" : ""}`}
          >
            <Heart size={16} className={wished ? "fill-violet-400" : ""} />
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
