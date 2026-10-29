import { useParams, Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import {
  ArrowLeft,
  ShoppingCart,
  Heart,
  Check,
  Truck,
  Shield,
  RotateCcw,
  Zap,
  Star,
} from "lucide-react";
import { StarRating } from "@/components/StarRating";
import { ProductCard } from "@/components/ProductCard";
import { useCart } from "@/context/CartContext";
import { useProducts } from "@/hooks/useProducts";
import { supabase } from "@/lib/supabase";
import type { Product, Review } from "@/types";
import { FALLBACK_PRODUCTS } from "@/data/catalog";

export function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const { products } = useProducts();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    async function fetchProduct() {
      const local = products.find((p) => p.id === id);
      if (local) {
        setProduct(local);
        return;
      }
      const { data } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
      if (data) {
        setProduct(data as Product);
      } else {
        const fallback = FALLBACK_PRODUCTS.find((p) => p.id === id);
        setProduct(fallback ?? null);
      }
    }

    async function fetchReviews() {
      if (!id) return;
      const { data } = await supabase
        .from("product_reviews")
        .select("*")
        .eq("product_id", id)
        .order("created_at", { ascending: false });
      if (data) setReviews(data as Review[]);
    }

    fetchProduct();
    fetchReviews();
    setActiveImage(0);
  }, [id, products]);

  const galleryImages = useMemo(() => {
    if (!product) return [];
    const imgs = [product.image_url];
    if (product.gallery && product.gallery.length > 0) {
      for (const g of product.gallery) {
        if (!imgs.includes(g)) imgs.push(g);
      }
    }
    return imgs;
  }, [product]);

  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return products
      .filter((p) => p.id !== product.id && p.category === product.category)
      .slice(0, 4);
  }, [product, products]);

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
  const outOfStock = product.stock === 0;
  const discount =
    product.original_price && product.original_price > product.price
      ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
      : null;

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    addToCart(product, quantity);
    navigate("/checkout");
  };

  const specs = product.specs ? Object.entries(product.specs) : [];

  return (
    <div className="section-padding">
      <div className="container-max">
        <button onClick={() => navigate(-1)} className="btn-ghost mb-6">
          <ArrowLeft size={16} />
          Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Gallery */}
          <div>
            <div className="glass-dark overflow-hidden rounded-2xl">
              <img
                src={galleryImages[activeImage]}
                alt={product.name}
                className="w-full h-[500px] object-cover"
              />
            </div>
            {galleryImages.length > 1 && (
              <div className="mt-4 flex gap-3">
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(idx)}
                    className={`h-20 w-20 overflow-hidden rounded-xl border-2 transition-all ${
                      activeImage === idx
                        ? "border-violet-500"
                        : "border-white/10 hover:border-violet-500/40"
                    }`}
                  >
                    <img src={img} alt={`Gallery ${idx + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col">
            <p className="text-sm font-bold text-violet-400 uppercase tracking-wide">{product.brand}</p>
            <h1 className="mt-2 font-display text-3xl md:text-4xl font-bold text-white">{product.name}</h1>

            <div className="mt-4 flex items-center gap-4">
              <StarRating rating={product.rating} size={20} />
              {reviews.length > 0 && (
                <span className="text-sm text-gray-500">({reviews.length} reviews)</span>
              )}
            </div>

            <p className="mt-6 text-gray-400 leading-relaxed text-lg">{product.description}</p>

            <div className="mt-6 flex items-center gap-3">
              <span className="font-display text-4xl font-bold gradient-text">
                ${product.price.toFixed(2)}
              </span>
              {discount && (
                <>
                  <span className="text-lg text-gray-500 line-through">
                    ${product.original_price!.toFixed(2)}
                  </span>
                  <span className="rounded-full bg-gradient-to-r from-violet-600 to-blue-600 px-3 py-1 text-xs font-bold text-white">
                    -{discount}%
                  </span>
                </>
              )}
            </div>

            {/* Stock */}
            <div className="mt-4">
              {outOfStock ? (
                <span className="rounded-full bg-red-600/20 px-3 py-1 text-sm font-medium text-red-300">
                  Out of Stock
                </span>
              ) : product.stock <= 5 ? (
                <span className="rounded-full bg-amber-600/20 px-3 py-1 text-sm font-medium text-amber-300">
                  Only {product.stock} left in stock
                </span>
              ) : (
                <span className="rounded-full bg-green-600/20 px-3 py-1 text-sm font-medium text-green-300">
                  In Stock ({product.stock} available)
                </span>
              )}
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

            {/* Specs */}
            {specs.length > 0 && (
              <div className="mt-6">
                <h3 className="font-display font-semibold text-white mb-3">Technical Specifications</h3>
                <div className="glass-dark rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <tbody>
                      {specs.map(([key, value], idx) => (
                        <tr key={key} className={idx % 2 === 0 ? "bg-white/[0.02]" : ""}>
                          <td className="px-4 py-2.5 text-gray-400 font-medium capitalize">{key.replace(/_/g, " ")}</td>
                          <td className="px-4 py-2.5 text-white">{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

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
                  disabled={outOfStock}
                  className="rounded-lg bg-white/5 px-3 py-2 text-gray-300 hover:bg-violet-600/20 transition-all disabled:opacity-40"
                >
                  +
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 flex gap-3">
              <button
                onClick={handleAddToCart}
                disabled={outOfStock}
                className="btn-primary flex-1 disabled:opacity-40 disabled:cursor-not-allowed"
              >
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
                onClick={handleBuyNow}
                disabled={outOfStock}
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-blue-500 px-6 py-3 font-semibold text-white shadow-lg shadow-violet-600/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-violet-600/40 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Zap size={20} />
                Buy Now
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

        {/* Reviews */}
        {reviews.length > 0 && (
          <section className="mt-16">
            <h2 className="font-display text-2xl font-bold text-white mb-6">Customer Reviews</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviews.map((review) => (
                <div key={review.id} className="glass-dark p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-white">{review.author}</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={14}
                          className={s <= Math.round(review.rating) ? "fill-violet-400 text-violet-400" : "fill-ink-700 text-ink-600"}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 leading-relaxed">{review.comment}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Related products */}
        {relatedProducts.length > 0 && (
          <section className="mt-16">
            <h2 className="font-display text-2xl font-bold text-white mb-6">Related Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((rp) => (
                <ProductCard key={rp.id} product={rp} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
