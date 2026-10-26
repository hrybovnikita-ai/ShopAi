import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  ChevronRight,
  Heart,
  PackageX,
  RotateCcw,
  Scale,
  Shield,
  ShoppingCart,
  Truck,
} from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { ReviewsSection } from "@/components/reviews/ReviewsSection";
import { StarRating } from "@/components/StarRating";
import { SkeletonBlock } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useCart } from "@/context/CartContext";
import { useCompare } from "@/context/CompareContext";
import { useToast } from "@/components/Toast";
import { apiRequest } from "@/lib/api";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { CatalogProduct, ProductStats } from "@/types";

interface ProductResponse {
  product: CatalogProduct;
  stats: ProductStats;
  related: CatalogProduct[];
}

export function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const { toggle: toggleCompare, isSelected } = useCompare();
  const { push } = useToast();

  const [data, setData] = useState<ProductResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setNotFound(false);

    apiRequest<ProductResponse>(`/catalog/${id}`, { signal: controller.signal })
      .then((response) => setData(response))
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        const status = (err as { status?: number }).status;
        if (status === 404 || status === 400) setNotFound(true);
        else setError(err instanceof Error ? err.message : "This product could not be loaded.");
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [id, reloadToken]);

  const refreshStats = useCallback(() => setReloadToken((token) => token + 1), []);

  if (loading && !data) {
    return (
      <div className="section-padding">
        <div className="container-max grid gap-12 lg:grid-cols-2">
          <SkeletonBlock className="h-[420px] w-full" />
          <div className="space-y-4">
            <SkeletonBlock className="h-4 w-24" />
            <SkeletonBlock className="h-10 w-3/4" />
            <SkeletonBlock className="h-4 w-40" />
            <SkeletonBlock className="h-24 w-full" />
            <SkeletonBlock className="h-12 w-40" />
          </div>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="section-padding">
        <div className="container-max">
          <EmptyState
            icon={PackageX}
            title="This product isn't available"
            description="It may have been removed from the catalog or is no longer active."
            action={
              <Link to="/shop" className="btn-primary">
                Browse the catalog
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="section-padding">
        <div className="container-max">
          <EmptyState
            icon={AlertTriangle}
            title="Product details didn't load"
            description={error ?? "Something went wrong while loading this product."}
            action={
              <button onClick={refreshStats} className="btn-primary">
                Try again
              </button>
            }
          />
        </div>
      </div>
    );
  }

  const { product, stats, related } = data;
  const wished = isInWishlist(product.id);
  const comparing = isSelected(product.id);
  const outOfStock = product.stock <= 0;
  const lowStock = !outOfStock && product.stock <= 5;

  const handleAddToCart = () => {
    if (outOfStock) return;
    addToCart(product, quantity);
    push(`${quantity} × ${product.name} added to your cart`, "success");
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="section-padding">
      <div className="container-max">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1 text-sm text-gray-500">
          <Link to="/" className="hover:text-white">Home</Link>
          <ChevronRight size={14} />
          <Link to="/shop" className="hover:text-white">Shop</Link>
          <ChevronRight size={14} />
          <Link to={`/shop?category=${encodeURIComponent(product.category)}`} className="hover:text-white">
            {product.category}
          </Link>
          <ChevronRight size={14} />
          <span className="truncate text-gray-300">{product.name}</span>
        </nav>

        <button onClick={() => navigate(-1)} className="btn-ghost mb-6">
          <ArrowLeft size={16} />
          Back
        </button>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-12">
          {/* Image */}
          <div className="group glass-dark overflow-hidden rounded-2xl">
            <img
              src={product.image_url}
              alt={product.name}
              className="h-[320px] w-full object-cover transition-transform duration-700 group-hover:scale-105 sm:h-[460px]"
            />
          </div>

          {/* Details */}
          <div className="flex flex-col">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-violet-600/20 px-3 py-1 text-xs font-medium text-violet-200">
                {product.category}
              </span>
              {product.brand && (
                <span className="rounded-full glass px-3 py-1 text-xs text-gray-300">{product.brand}</span>
              )}
              {outOfStock ? (
                <span className="rounded-full bg-red-500/15 px-3 py-1 text-xs font-semibold text-red-200 ring-1 ring-red-500/30">
                  Out of stock
                </span>
              ) : lowStock ? (
                <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-200 ring-1 ring-amber-500/30">
                  Only {product.stock} left
                </span>
              ) : (
                <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-200 ring-1 ring-emerald-500/30">
                  In stock
                </span>
              )}
            </div>

            <h1 className="mt-4 font-display text-3xl font-bold text-white md:text-4xl">{product.name}</h1>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <StarRating rating={stats.rating_avg} count={stats.review_count} />
              <a href="#reviews" className="text-sm text-violet-300 hover:text-violet-200">
                Read reviews
              </a>
            </div>

            <p className="mt-5 text-lg leading-relaxed text-gray-400">{product.description}</p>

            <div className="mt-6 flex flex-wrap items-end gap-3">
              <span className="font-display text-4xl font-bold gradient-text">
                {formatCurrency(product.price)}
              </span>
              <span className="pb-1 text-sm text-gray-500">
                {formatNumber(product.units_sold)} sold
              </span>
            </div>

            {/* Specs */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="glass p-3">
                <p className="text-[11px] uppercase tracking-wide text-gray-500">Brand</p>
                <p className="mt-0.5 text-sm text-white">{product.brand ?? "—"}</p>
              </div>
              <div className="glass p-3">
                <p className="text-[11px] uppercase tracking-wide text-gray-500">Availability</p>
                <p className="mt-0.5 text-sm text-white">
                  {outOfStock ? "Out of stock" : `${product.stock} in stock`}
                </p>
              </div>
            </div>

            {product.features.length > 0 && (
              <div className="mt-6">
                <h3 className="mb-3 font-display font-semibold text-white">Specifications</h3>
                <ul className="flex flex-wrap gap-2">
                  {product.features.map((feature) => (
                    <li key={feature} className="rounded-full glass px-3 py-1.5 text-sm text-violet-200">
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Quantity */}
            <div className="mt-8 flex items-center gap-4">
              <label className="text-sm text-gray-300" htmlFor="quantity">
                Quantity
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="rounded-lg bg-white/5 px-3 py-2 text-gray-300 transition-all hover:bg-violet-600/20"
                  aria-label="Decrease quantity"
                >
                  –
                </button>
                <span id="quantity" className="w-10 text-center font-medium text-white" aria-live="polite">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(Math.max(1, product.stock), quantity + 1))}
                  disabled={quantity >= product.stock}
                  className="rounded-lg bg-white/5 px-3 py-2 text-gray-300 transition-all hover:bg-violet-600/20 disabled:opacity-40"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={handleAddToCart}
                disabled={outOfStock}
                className="btn-primary flex-1 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {added ? (
                  <>
                    <Check size={20} />
                    Added to Cart!
                  </>
                ) : (
                  <>
                    <ShoppingCart size={20} />
                    {outOfStock ? "Out of stock" : "Add to Cart"}
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  toggleWishlist(product);
                  push(
                    wished ? "Removed from your wishlist" : "Saved to your wishlist",
                    "info",
                  );
                }}
                className={`btn-secondary !px-4 ${wished ? "text-violet-400" : ""}`}
                aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
                aria-pressed={wished}
              >
                <Heart size={20} className={wished ? "fill-violet-400" : ""} />
              </button>
              <button
                onClick={() => toggleCompare(product)}
                className={`btn-secondary !px-4 ${comparing ? "text-violet-300" : ""}`}
                aria-label={comparing ? "Remove from comparison" : "Add to comparison"}
                aria-pressed={comparing}
              >
                <Scale size={20} />
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
                  <badge.icon size={22} className="mx-auto mb-2 text-violet-400" />
                  <p className="text-xs text-gray-400">{badge.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Reviews */}
        <ReviewsSection productId={product.id} stats={stats} onStatsChange={refreshStats} />

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-16">
            <div className="mb-6 flex items-end justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold text-white">More in {product.category}</h2>
                <p className="mt-1 text-sm text-gray-400">Customers also looked at these.</p>
              </div>
              <Link
                to={`/shop?category=${encodeURIComponent(product.category)}`}
                className="btn-ghost"
              >
                View all
                <ChevronRight size={16} />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
