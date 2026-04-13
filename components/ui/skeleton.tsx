// Loading-skeleton primitives. They use the `.skeleton` shimmer class
// defined in app/globals.css (gray gradient + 1.4s shimmer animation).

interface BaseProps { className?: string }

export function Skeleton({ className = '' }: BaseProps) {
  return <div className={`skeleton ${className}`} />
}

// Single text line — defaults to 75% width, 14px tall.
export function SkeletonText({ className = 'h-3.5 w-3/4' }: BaseProps) {
  return <Skeleton className={`rounded-full ${className}`} />
}

// Card-shaped block — fills its container by default.
export function SkeletonCard({ className = 'h-32 w-full' }: BaseProps) {
  return <Skeleton className={`rounded-2xl ${className}`} />
}

// List/table row — full width, ~64px tall.
export function SkeletonRow({ className = 'h-16 w-full' }: BaseProps) {
  return <Skeleton className={`rounded-xl ${className}`} />
}

// Chart-shaped block — taller than a card.
export function SkeletonChart({ className = 'h-64 w-full' }: BaseProps) {
  return <Skeleton className={`rounded-2xl ${className}`} />
}

// Avatar / icon circle.
export function SkeletonCircle({ size = 40 }: { size?: number }) {
  return <Skeleton className="rounded-full" />
}

// Convenience: a richer KPI card placeholder with two stacked text lines.
export function SkeletonKPICard() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 space-y-3">
      <SkeletonText className="h-3 w-24" />
      <SkeletonText className="h-7 w-20" />
      <SkeletonText className="h-2.5 w-32" />
    </div>
  )
}

// Convenience: a list-row placeholder with avatar + two text lines + value.
export function SkeletonListRow() {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 flex items-center gap-3">
      <Skeleton className="h-10 w-10 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <SkeletonText className="h-3 w-1/3" />
        <SkeletonText className="h-2.5 w-1/2" />
      </div>
      <SkeletonText className="h-3 w-16 shrink-0" />
    </div>
  )
}
