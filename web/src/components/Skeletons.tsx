import type { ReactNode } from 'react'

function SkeletonCard({ children }: { children?: ReactNode }) {
  return <div className="skeleton-card">{children}</div>
}

export function CardsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="loading-grid three" role="status" aria-label="İçerik yükleniyor">
      {Array.from({ length: count }, (_, index) => (
        <SkeletonCard key={index}>
          <div className="skeleton skeleton-photo" />
          <div className="skeleton-lines">
            <div className="skeleton-line medium" />
            <div className="skeleton-line short" />
          </div>
        </SkeletonCard>
      ))}
    </div>
  )
}

export function DetailSkeleton() {
  return (
    <div className="page" role="status" aria-label="İçerik yükleniyor">
      <div className="skeleton skeleton-line short" style={{ height: 14, marginBottom: 16 }} />
      <div className="skeleton" style={{ height: 38, width: '58%', marginBottom: 12 }} />
      <div className="skeleton" style={{ height: 16, width: '42%', marginBottom: 24 }} />
      <div className="skeleton skeleton-photo" style={{ aspectRatio: '4 / 3', marginBottom: 20 }} />
      <div className="loading-grid">
        <div className="skeleton skeleton-line medium" />
        <div className="skeleton skeleton-line" />
        <div className="skeleton skeleton-line short" />
      </div>
    </div>
  )
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="loading-grid" role="status" aria-label="Liste yükleniyor">
      {Array.from({ length: count }, (_, index) => (
        <SkeletonCard key={index}>
          <div className="skeleton" style={{ height: 88, borderRadius: 0 }} />
          <div className="skeleton-lines">
            <div className="skeleton-line medium" />
            <div className="skeleton-line short" />
          </div>
        </SkeletonCard>
      ))}
    </div>
  )
}
