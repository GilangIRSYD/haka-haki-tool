/**
 * Skeleton loading components for emitten summary
 */

export function EmittenSummarySkeleton() {
  return (
    <div className="h-full overflow-y-auto p-4 space-y-4 animate-pulse">
      {/* Header Skeleton */}
      <div className="text-center pb-4 border-b border-violet-800">
        <div className="h-8 bg-violet-800 rounded mx-auto w-32 mb-2"></div>
        <div className="h-4 bg-violet-900 rounded mx-auto w-48 mb-1"></div>
        <div className="h-3 bg-violet-900 rounded mx-auto w-24"></div>
      </div>

      {/* Price Info Skeleton */}
      <div className="bg-violet-900/50 rounded-lg p-3">
        <div className="h-4 bg-violet-800 rounded w-24 mb-2"></div>
        <div className="h-8 bg-violet-800 rounded w-20 mb-1"></div>
        <div className="h-4 bg-violet-800 rounded w-16"></div>
      </div>

      {/* Key Metrics Grid Skeleton */}
      <div className="space-y-2">
        <div className="h-4 bg-violet-800 rounded w-32"></div>
        <div className="grid grid-cols-2 gap-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-14 bg-violet-900/30 rounded"></div>
          ))}
        </div>
      </div>

      {/* Financial Summary Skeleton */}
      <div className="space-y-2">
        <div className="h-4 bg-violet-800 rounded w-40"></div>
        <div className="space-y-2">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-10 bg-violet-900/30 rounded"></div>
          ))}
        </div>
      </div>

      {/* Charts Skeleton */}
      <div className="space-y-3 border-t border-violet-800 pt-4">
        <div className="h-4 bg-violet-800 rounded w-36"></div>
        <div className="h-48 bg-violet-900/30 rounded-lg"></div>
      </div>

      <div className="space-y-3 border-t border-violet-800 pt-4">
        <div className="h-4 bg-violet-800 rounded w-40"></div>
        <div className="h-32 bg-violet-900/30 rounded-lg"></div>
      </div>
    </div>
  );
}

export function ChartSkeleton({ height = 200 }: { height?: number }) {
  return (
    <div className={`bg-violet-900/30 rounded-lg animate-pulse`} style={{ height }}>
      <div className="flex items-center justify-center h-full">
        <div className="text-violet-600">Loading chart...</div>
      </div>
    </div>
  );
}
