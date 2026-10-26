/** Loading placeholders that mirror the real card grid. */
export function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`skeleton rounded-xl ${className}`} aria-hidden="true" />;
}

export function ProductCardSkeleton() {
  return (
    <div className="glass-dark overflow-hidden" aria-hidden="true">
      <SkeletonBlock className="h-56 rounded-none" />
      <div className="space-y-3 p-5">
        <SkeletonBlock className="h-5 w-3/4" />
        <SkeletonBlock className="h-3 w-full" />
        <SkeletonBlock className="h-3 w-2/3" />
        <div className="flex items-center justify-between pt-2">
          <SkeletonBlock className="h-7 w-24" />
          <SkeletonBlock className="h-8 w-28" />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function ReviewSkeleton() {
  return (
    <div className="glass-dark space-y-3 p-5" aria-hidden="true">
      <SkeletonBlock className="h-4 w-32" />
      <SkeletonBlock className="h-3 w-full" />
      <SkeletonBlock className="h-3 w-5/6" />
    </div>
  );
}
