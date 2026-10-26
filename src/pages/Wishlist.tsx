import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

export function Wishlist() {
  const { wishlist } = useCart();
  const { user, isDemo } = useAuth();

  return (
    <div className="section-padding">
      <div className="container-max">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-white md:text-4xl">Your wishlist</h1>
          <p className="mt-2 text-sm text-gray-400">
            {user && !isDemo
              ? "Saved to your account — it follows you across devices."
              : "Saved in this browser. Sign in to keep your favourites with your account."}
          </p>
        </div>

        {wishlist.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="Nothing saved yet"
            description="Tap the heart on any product to keep it here for later."
            action={
              <Link to="/shop" className="btn-primary">
                Browse products
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {wishlist.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
