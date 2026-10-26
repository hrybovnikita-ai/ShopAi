import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  BadgeCheck,
  MessageSquare,
  Pencil,
  PenLine,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/Toast";
import { ReviewForm } from "./ReviewForm";
import { StarRating } from "@/components/StarRating";
import { EmptyState } from "@/components/ui/EmptyState";
import { ReviewSkeleton } from "@/components/ui/Skeleton";
import { formatDate } from "@/lib/format";
import type { ProductReview, ProductStats } from "@/types";

type SortKey = "newest" | "highest" | "lowest";

const SORT_LABELS: Record<SortKey, string> = {
  newest: "Newest first",
  highest: "Highest rating",
  lowest: "Lowest rating",
};

interface ReviewsSectionProps {
  productId: string;
  stats: ProductStats;
  onStatsChange: () => void;
}

export function ReviewsSection({ productId, stats, onStatsChange }: ReviewsSectionProps) {
  const { user, isDemo } = useAuth();
  const { push } = useToast();
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>("newest");
  const [formOpen, setFormOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error: loadError } = await supabase
      .from("product_reviews")
      .select("*")
      .eq("product_id", productId)
      .order("created_at", { ascending: false });

    if (loadError) setError(loadError.message);
    else {
      setError(null);
      setReviews((data ?? []) as ProductReview[]);
    }
    setLoading(false);
  }, [productId]);

  useEffect(() => {
    void load();
  }, [load]);

  const refreshAll = () => {
    void load();
    onStatsChange();
  };

  const myReview = useMemo(
    () => (user && !isDemo ? reviews.find((review) => review.user_id === user.id) ?? null : null),
    [reviews, user, isDemo],
  );

  const sorted = useMemo(() => {
    const list = [...reviews];
    if (sort === "highest") list.sort((a, b) => b.rating - a.rating || b.created_at.localeCompare(a.created_at));
    else if (sort === "lowest") list.sort((a, b) => a.rating - b.rating || b.created_at.localeCompare(a.created_at));
    else list.sort((a, b) => b.created_at.localeCompare(a.created_at));
    return list;
  }, [reviews, sort]);

  const total = stats.review_count;
  const distribution = stats.distribution ?? {};

  const removeReview = async (review: ProductReview) => {
    if (!user) return;
    const { error: deleteError } = await supabase
      .from("product_reviews")
      .delete()
      .eq("id", review.id)
      .eq("user_id", user.id);

    if (deleteError) {
      push(deleteError.message, "error");
      return;
    }
    push("Your review was deleted", "info");
    setFormOpen(false);
    refreshAll();
  };

  return (
    <section id="reviews" className="mt-16">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-white">Customer reviews</h2>
          <p className="mt-1 text-sm text-gray-400">
            Every rating below comes from a published review. “Verified purchase” is granted by the
            backend only after a completed order.
          </p>
        </div>
        {sorted.length > 1 && (
          <label className="flex items-center gap-2 text-sm text-gray-400">
            Sort
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortKey)}
              className="input-field !w-auto !py-2 text-sm"
            >
              {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                <option key={key} value={key} className="bg-ink-900">
                  {SORT_LABELS[key]}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        {/* Summary */}
        <div className="glass-dark h-fit p-6">
          {total > 0 ? (
            <>
              <div className="flex items-end gap-3">
                <span className="font-display text-5xl font-bold gradient-text">
                  {(stats.rating_avg ?? 0).toFixed(1)}
                </span>
                <div className="pb-1">
                  <StarRating rating={stats.rating_avg} showValue={false} size={16} />
                  <p className="mt-1 text-xs text-gray-400">
                    {total} review{total === 1 ? "" : "s"}
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-2">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = Number(distribution[String(star)] ?? 0);
                  const percent = total > 0 ? Math.round((count / total) * 100) : 0;
                  return (
                    <div key={star} className="flex items-center gap-2 text-xs text-gray-400">
                      <span className="w-8 shrink-0">{star}★</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500 transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="w-8 shrink-0 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-center">
              <MessageSquare size={28} className="mx-auto mb-3 text-violet-300" />
              <p className="font-display text-lg font-semibold text-white">No reviews yet</p>
              <p className="mt-1 text-sm text-gray-400">
                Be the first to share what you think about this product.
              </p>
            </div>
          )}
        </div>

        {/* List + form */}
        <div className="space-y-4">
          {/* Review actions */}
          {!user && (
            <div className="glass flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-300">Sign in to rate this product and write a review.</p>
              <Link to="/signin" className="btn-primary !py-2 text-sm">
                <PenLine size={16} />
                Sign in to review
              </Link>
            </div>
          )}

          {user && isDemo && (
            <div className="glass flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-300">
                <ShieldAlert size={16} className="mr-1 inline text-amber-300" />
                Demo accounts can browse, but reviews are stored per real account.
              </p>
              <Link to="/signup" className="btn-secondary !py-2 text-sm">
                Create an account
              </Link>
            </div>
          )}

          {myReview && myReview.status === "hidden" && (
            <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              Your review is hidden by moderation and is only visible to you.
            </p>
          )}

          {user && !isDemo && !formOpen && (
            <div className="flex flex-wrap items-center gap-3">
              {myReview ? (
                <>
                  <button onClick={() => setFormOpen(true)} className="btn-secondary !py-2 text-sm">
                    <Pencil size={15} />
                    Edit your review
                  </button>
                  {confirmingDelete ? (
                    <span className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-2 py-1">
                      <span className="text-xs text-red-200">Delete this review?</span>
                      <button
                        onClick={() => {
                          setConfirmingDelete(false);
                          void removeReview(myReview);
                        }}
                        className="rounded-lg bg-red-500/30 px-2 py-1 text-xs font-semibold text-red-100 hover:bg-red-500/40"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setConfirmingDelete(false)}
                        className="rounded-lg px-2 py-1 text-xs text-gray-300 hover:text-white"
                      >
                        Cancel
                      </button>
                    </span>
                  ) : (
                    <button
                      onClick={() => setConfirmingDelete(true)}
                      className="btn-ghost text-red-300 hover:text-red-200"
                    >
                      <Trash2 size={15} />
                      Delete
                    </button>
                  )}
                </>
              ) : (
                <button onClick={() => setFormOpen(true)} className="btn-primary !py-2.5 text-sm">
                  <PenLine size={16} />
                  Write a review
                </button>
              )}
            </div>
          )}

          {formOpen && user && !isDemo && (
            <ReviewForm
              productId={productId}
              existing={myReview}
              onSaved={() => {
                setFormOpen(false);
                refreshAll();
              }}
              onCancel={() => setFormOpen(false)}
            />
          )}

          {/* Reviews */}
          {loading ? (
            <div className="space-y-3">
              <ReviewSkeleton />
              <ReviewSkeleton />
            </div>
          ) : error ? (
            <EmptyState
              icon={AlertTriangle}
              title="Reviews didn't load"
              description={error}
              action={
                <button onClick={() => void load()} className="btn-primary">
                  Try again
                </button>
              }
            />
          ) : sorted.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="No reviews to show yet"
              description="Reviews from real customers will appear here as soon as they are published."
            />
          ) : (
            <ul className="space-y-3">
              {sorted.map((review) => (
                <li key={review.id} className="glass-dark p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full gradient-bg text-sm font-bold uppercase text-white">
                        {review.author_name.charAt(0)}
                      </span>
                      <div>
                        <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-white">
                          {review.author_name}
                          {review.verified_purchase && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-300 ring-1 ring-emerald-500/30">
                              <BadgeCheck size={12} />
                              Verified purchase
                            </span>
                          )}
                          {user && review.user_id === user.id && (
                            <span className="rounded-full bg-violet-600/20 px-2 py-0.5 text-[11px] text-violet-200">
                              You
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500">{formatDate(review.created_at)}</p>
                      </div>
                    </div>
                    <StarRating rating={review.rating} showValue={false} size={15} />
                  </div>

                  {review.title && (
                    <h3 className="mt-3 font-display text-base font-semibold text-white">{review.title}</h3>
                  )}
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-gray-300">{review.body}</p>

                  {review.images?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {review.images.map((image, index) => (
                        <a
                          key={index}
                          href={image}
                          target="_blank"
                          rel="noreferrer"
                          className="h-20 w-20 overflow-hidden rounded-lg border border-white/10 transition-transform hover:scale-105"
                          aria-label={`Open review photo ${index + 1}`}
                        >
                          <img src={image} alt={`Review by ${review.author_name}, photo ${index + 1}`} className="h-full w-full object-cover" />
                        </a>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
