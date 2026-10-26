import { useCallback, useEffect, useState } from "react";
import { BadgeCheck, Eye, EyeOff, MessageSquare, RefreshCw } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { Badge, EmptyState, PageHeader, Pagination, Skeleton } from "@/components/admin/ui";
import { useToast } from "@/components/Toast";
import { StarRating } from "@/components/StarRating";

interface AdminReview {
  id: string;
  product_id: string;
  product_name: string;
  author_name: string;
  rating: number;
  title: string;
  body: string;
  verified_purchase: boolean;
  status: "published" | "hidden";
  created_at: string;
}

interface ReviewPage {
  items: AdminReview[];
  total: number;
  page: number;
  pageSize: number;
}

const FILTERS = [
  { value: "", label: "All reviews" },
  { value: "published", label: "Published" },
  { value: "hidden", label: "Hidden" },
];

export function AdminReviews() {
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ReviewPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { push } = useToast();

  const load = useCallback(async (signal?: AbortSignal) => {
    const params = new URLSearchParams({ page: String(page), pageSize: "10" });
    if (status) params.set("status", status);

    setLoading(true);
    try {
      const result = await apiRequest<ReviewPage>(`/admin/reviews?${params.toString()}`, { signal });
      setData(result);
      setError(null);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Could not load reviews");
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load, reloadKey]);

  const moderate = async (review: AdminReview) => {
    const next = review.status === "published" ? "hidden" : "published";
    setUpdatingId(review.id);
    try {
      await apiRequest(`/admin/reviews/${review.id}`, { method: "PATCH", body: { status: next } });
      push(next === "hidden" ? "Review hidden from the storefront" : "Review published");
      setReloadKey((key) => key + 1);
    } catch (err) {
      push(err instanceof Error ? err.message : "Could not update the review", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const items = data?.items ?? [];
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div>
      <PageHeader
        title="Reviews"
        description="Moderate customer reviews. Hidden reviews stay visible to their author and administrators only."
        actions={
          <button
            type="button"
            onClick={() => setReloadKey((key) => key + 1)}
            className="btn-secondary !py-2.5 text-sm"
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        {FILTERS.map((filter) => (
          <button
            key={filter.value}
            onClick={() => {
              setStatus(filter.value);
              setPage(1);
            }}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              status === filter.value
                ? "bg-violet-600 text-white"
                : "glass text-gray-300 hover:text-white"
            }`}
          >
            {filter.label}
          </button>
        ))}
        {data && <span className="ml-auto text-sm text-gray-500">{data.total} total</span>}
      </div>

      {loading && !data ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-40 w-full" />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          icon={MessageSquare}
          title="Reviews didn't load"
          description={error}
          action={
            <button onClick={() => setReloadKey((key) => key + 1)} className="btn-primary">
              Try again
            </button>
          }
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No reviews in this view"
          description="Customer reviews will appear here once they are submitted."
        />
      ) : (
        <ul className="space-y-3">
          {items.map((review) => (
            <li key={review.id} className="glass-dark p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-white">
                    {review.author_name}
                    {review.verified_purchase && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] text-emerald-300 ring-1 ring-emerald-500/30">
                        <BadgeCheck size={12} /> Verified purchase
                      </span>
                    )}
                    <Badge tone={review.status === "published" ? "violet" : "warning"}>
                      {review.status}
                    </Badge>
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {review.product_name} · {formatDateTime(review.created_at)}
                  </p>
                </div>
                <StarRating rating={review.rating} showValue size={14} />
              </div>

              {review.title && (
                <p className="mt-3 font-display text-base font-semibold text-white">{review.title}</p>
              )}
              <p className="mt-1.5 whitespace-pre-line text-sm text-gray-300">{review.body}</p>

              <div className="mt-3 flex justify-end">
                <button
                  onClick={() => void moderate(review)}
                  disabled={updatingId === review.id}
                  className="btn-secondary !py-2 text-xs"
                >
                  {review.status === "published" ? <EyeOff size={14} /> : <Eye size={14} />}
                  {updatingId === review.id
                    ? "Updating…"
                    : review.status === "published"
                      ? "Hide review"
                      : "Publish review"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {data && totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} total={data.total} onPage={setPage} />
      )}
    </div>
  );
}
