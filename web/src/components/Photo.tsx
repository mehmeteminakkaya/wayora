import { useState } from 'react'
import type { ReactNode } from 'react'

type PhotoProps = {
  src?: string | null
  alt: string
  label: string
  className?: string
  children?: ReactNode
  priority?: boolean
}

export function Photo({ src, alt, label, className = '', children, priority = false }: PhotoProps) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) {
    return (
      <div className={`photo photo-placeholder ${className}`} role="img" aria-label={alt}>
        <span>{label}</span>
        {children}
      </div>
    )
  }
  return (
    <div className={`photo ${className}`}>
      <img
        src={src}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
        draggable={false}
        onError={() => setFailed(true)}
      />
      {children}
    </div>
  )
}
