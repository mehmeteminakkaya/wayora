import { useState } from 'react'
import type { ReactNode } from 'react'

type PhotoProps = {
  src?: string | null
  alt: string
  label: string
  className?: string
  children?: ReactNode
}

export function Photo({ src, alt, label, className = '', children }: PhotoProps) {
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
        loading="lazy"
        decoding="async"
        draggable={false}
        onError={() => setFailed(true)}
      />
      {children}
    </div>
  )
}
