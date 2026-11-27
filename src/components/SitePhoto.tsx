import { useState } from 'react'
import { cx } from './ui'

export function SitePhoto({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) {
    return <div className={cx('brand-gradient', className)} aria-hidden={alt.length === 0} />
  }
  return <img src={src} alt={alt} className={className} onError={() => setFailed(true)} />
}
