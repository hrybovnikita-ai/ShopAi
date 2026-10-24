import { useParams, Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowLeft, ShoppingCart, Heart, Check, Truck, Shield, RotateCcw } from "lucide-react";
import { StarRating } from "@/components/StarRating";
import { useCart } from "@/context/CartContext";
import { useProducts } from "@/hooks/useProducts";
import { supabase } from "@/lib/supabase";
import type { Product } from "@/types";
import { FALLBACK_PRODUCTS } from "@/data/catalog";

export function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const { products } = useProducts();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    async function fetchProduct() {
      // Try local cache first
      const local = products.find((p) => p.id === id);
      if (local) {
        setProduct(local);
        return;
      }

      // Try DB
      const { data } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
      if (data) {
        setProduct(data as Product);
      } else {
        // Fallback
        const fallback = FALLBACK_PRODUCTS.find((p) => p.id === id);
        setProduct(fallback ?? null);
      }
    }
    fetchProduct();
  }, [id, products]);

  if (!product) {
    return (
      <div className="section-padding">
        <div className="container-max text-center">
          <h1 className="font-display text-3xl font-bold text-white">Product Not Found</h1>
          <Link to="/" className="btn-primary mt-6 inline-flex">Back to Home</Link>
        </div>
      </div>
    );
  }

  const wished = isInWishlist(product.id);

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="section-padding">
      <div className="container-max">
        <button onClick={() => navigate(-1)} className="btn-ghost mb-6">
          <ArrowLeft size={16} />
          Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image */}
          <div className="glass-dark overflow-hidden rounded-2xl">
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-[500px] object-cover"
            />
          </div>

          {/* Details */}
          <div className="flex flex-col">
            <span className="inline-block w-fit rounded-full bg-violet-600/20 px-3 py-1 text-xs font-medium text-violet-200 mb-4">
              {product.category}
            </span>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-white">{product.name}</h1>

            <div className="mt-4">
              <StarRating rating={product.rating} size={20} />
            </div>

            <p className="mt-6 text-gray-400 leading-relaxed text-lg">{product.description}</p>

            <div className="mt-6">
              <span className="font-display text-4xl font-bold gradient-text">
                ${product.price.toFixed(2)}
              </span>
            </div>

            {/* Features */}
            <div className="mt-6">
              <h3 className="font-display font-semibold text-white mb-3">Key Features</h3>
              <div className="flex flex-wrap gap-2">
                {product.features.map((f) => (
                  <span key={f} className="rounded-full glass px-3 py-1.5 text-sm text-violet-200">
                    {f}
                  </span>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div className="mt-8 flex items-center gap-4">
              <label className="text-sm text-gray-300">Quantity:</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="rounded-lg bg-white/5 px-3 py-2 text-gray-300 hover:bg-violet-600/20 transition-all"
                >
                  –
                </button>
                <span className="w-12 text-center text-white font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="rounded-lg bg-white/5 px-3 py-2 text-gray-300 hover:bg-violet-600/20 transition-all"
                >
                  +
                </button>
              </div>
              <span className="text-sm text-gray-500">{product.stock} in stock</span>
            </div>

            {/* Actions */}
            <div className="mt-8 flex gap-3">
              <button onClick={handleAddToCart} className="btn-primary flex-1">
                {added ? (
                  <>
                    <Check size={20} />
                    Added to Cart!
                  </>
                ) : (
                  <>
                    <ShoppingCart size={20} />
                    Add to Cart
                  </>
                )}
              </button>
              <button
                onClick={() => toggleWishlist(product)}
                className={`btn-secondary !px-4 ${wished ? "text-violet-400" : ""}`}
                aria-label="Add to wishlist"
              >
                <Heart size={20} className={wished ? "fill-violet-400" : ""} />
              </button>
            </div>

            {/* Trust badges */}
            <div className="mt-8 grid grid-cols-3 gap-4">
              {[
                { icon: Truck, label: "Free Shipping" },
                { icon: Shield, label: "Secure Payment" },
                { icon: RotateCcw, label: "30-Day Returns" },
              ].map((badge) => (
                <div key={badge.label} className="glass p-4 text-center">
                  <badge.icon size={22} className="text-violet-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-400">{badge.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
