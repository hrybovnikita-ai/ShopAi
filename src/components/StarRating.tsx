import { Star } from "lucide-react";

interface StarRatingProps {
  /** Review average; `null`/0 renders empty stars rather than an invented score. */
  rating: number | null | undefined;
  size?: number;
  /** Number of published reviews backing the average. */
  count?: number;
  /** Hide the numeric value (used in compact cards). */
  showValue?: boolean;
}

export function StarRating({ rating, size = 16, count, showValue = true }: StarRatingProps) {
  const value = Number(rating ?? 0);

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= Math.floor(value);
        const half = !filled && star - 0.5 <= value;
        return (
          <Star
            key={star}
            size={size}
            aria-hidden="true"
            className={
              filled
                ? "fill-violet-400 text-violet-400"
                : half
                  ? "fill-violet-400/50 text-violet-400"
                  : "fill-ink-700 text-ink-600"
            }
          />
        );
      })}
      {showValue && (
        <span className="ml-1 text-sm text-gray-400">
          {value > 0 ? value.toFixed(1) : "No rating"}
        </span>
      )}
      {typeof count === "number" && (
        <span className="text-xs text-gray-500">
          ({count} {count === 1 ? "review" : "reviews"})
        </span>
      )}
    </div>
  );
}
