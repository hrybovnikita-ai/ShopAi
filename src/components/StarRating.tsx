import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  size?: number;
}

export function StarRating({ rating, size = 16 }: StarRatingProps) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= Math.floor(rating);
        const half = !filled && star - 0.5 <= rating;
        return (
          <Star
            key={star}
            size={size}
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
      <span className="ml-1 text-sm text-gray-400">{rating.toFixed(1)}</span>
    </div>
  );
}
