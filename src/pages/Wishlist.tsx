import { Link } from "react-router-dom";
import { Heart, ShoppingCart, Trash2, ArrowRight, ArrowLeft } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/components/Toast";
import { ProductCard } from "@/components/ProductCard";

export function Wishlist() {
  const { wishlist, removeFromWishlist, addToCart, toggleWishlist } = useCart();
  const { push } = useToast();

  const moveToCart = (product: typeof wishlist[0]) => {
    addToCart(product);
    removeFromWishlist(product.id);
    push(`${product.name} moved to cart`, "success");
  };

  if (wishlist.length === 0) {
    return (
      <div className="section-padding">
        <div className="container-max max-w-2xl text-center">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl glass mb-6">
            <Heart size={36} className="text-violet-400" />
          </div>
          <h1 className="font-display text-3xl font-bold text-white">Your Wishlist is Empty</h1>
          <p className="mt-3 text-gray-400">
            Save your favorite products by clicking the heart icon on any product card.
          </p>
          <Link to="/" className="btn-primary mt-8 inline-flex">
            Browse Products
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="section-padding">
      <div className="container-max">
        <Link to="/" className="btn-ghost mb-6">
          <ArrowLeft size={16} />
          Continue Shopping
        </Link>

        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-white">
            My Wishlist
          </h1>
          <span className="text-sm text-gray-400">{wishlist.length} item{wishlist.length !== 1 ? "s" : ""}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {wishlist.map((product) => (
            <div key={product.id} className="flex flex-col gap-3">
              <ProductCard product={product} />
              <div className="flex gap-2">
                <button
                  onClick={() => moveToCart(product)}
                  className="btn-primary flex-1 !py-2.5 text-sm"
                >
                  <ShoppingCart size={16} />
                  Move to Cart
                </button>
                <button
                  onClick={() => removeFromWishlist(product.id)}
                  className="btn-secondary !px-3 !py-2.5"
                  aria-label={`Remove ${product.name} from wishlist`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
