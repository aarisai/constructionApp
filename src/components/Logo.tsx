import { cx } from './ui'

export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cx('size-11 shrink-0', className)} aria-hidden="true">
      <rect width="64" height="64" rx="18" fill="#7a5344" />
      <circle cx="46" cy="18" r="6" fill="#f3d7a1" />
      <path d="M14 36 32 18l18 18" fill="#fffaf6" />
      <rect x="20" y="33" width="24" height="17" rx="1.5" fill="#fffaf6" />
      <rect x="23.5" y="37" width="5.5" height="5.5" rx="0.8" fill="#e7c9a2" />
      <rect x="29" y="40" width="6.5" height="10" rx="0.6" fill="#c45c34" />
    </svg>
  )
}
