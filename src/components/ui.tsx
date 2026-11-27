import { useEffect, useId, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { formatINR } from '../lib/format'

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

export function buttonClass(variant: 'primary' | 'secondary' | 'ghost' | 'danger' = 'primary', block = false): string {
  return cx(
    'inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-4 text-base font-semibold',
    block && 'w-full',
    variant === 'primary' && 'brand-gradient',
    variant === 'secondary' && 'border border-line bg-card text-ink',
    variant === 'ghost' && 'bg-transparent text-ink',
    variant === 'danger' && 'bg-due-soft text-due',
  )
}

export function Button({
  variant = 'primary',
  block,
  className,
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  block?: boolean
}) {
  return <button type={type} {...props} className={cx(buttonClass(variant, block), className)} />
}

export function IconButton({
  label,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      {...props}
      aria-label={label}
      className={cx('grid size-12 place-items-center rounded-2xl border border-line bg-card text-ink', className)}
    >
      {children}
    </button>
  )
}

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string
  hint?: string
  error?: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold">{label}</span>
      {children}
      {error ? (
        <span className="mt-1 block text-sm font-medium text-due">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-sm text-muted">{hint}</span>
      ) : null}
    </label>
  )
}

export function inputClassName(invalid?: boolean): string {
  return cx(
    'min-h-12 w-full rounded-xl border bg-paper px-3 text-base text-ink placeholder:text-muted/70',
    invalid ? 'border-due' : 'border-line',
  )
}

export function Badge({
  tone,
  children,
}: {
  tone: 'cash' | 'wait' | 'due' | 'neutral' | 'brand'
  children: ReactNode
}) {
  const tones = {
    cash: 'bg-cash-soft text-cash',
    wait: 'bg-wait-soft text-wait',
    due: 'bg-due-soft text-due',
    neutral: 'bg-line text-ink',
    brand: 'bg-brand text-on-brand',
  }
  return <span className={cx('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold', tones[tone])}>{children}</span>
}

export function Money({
  value,
  tone = 'ink',
  className,
}: {
  value: number
  tone?: 'ink' | 'cash' | 'due' | 'wait' | 'out'
  className?: string
}) {
  const color = {
    ink: 'text-ink',
    cash: 'text-cash',
    due: 'text-due',
    wait: 'text-wait',
    out: 'text-out',
  }[tone]
  return <span className={cx('font-semibold tabular-nums', color, className)}>{formatINR(value)}</span>
}

export function Meter({ value, max, tone }: { value: number; max: number; tone: 'cash' | 'wait' | 'due' | 'brand' }) {
  const pct = max <= 0 ? 0 : Math.min(100, Math.max(0, (value / max) * 100))
  const color = tone === 'cash' ? 'bg-cash' : tone === 'wait' ? 'bg-wait' : tone === 'due' ? 'bg-due' : 'meter-brand'
  return (
    <div className="h-2.5 overflow-hidden rounded-full bg-line" role="meter" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <div className={cx('h-full rounded-full', color)} style={{ width: `${pct}%` }} />
    </div>
  )
}

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: Array<{ value: T; label: string }>
  onChange: (value: T) => void
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="grid gap-1 rounded-2xl bg-line/70 p-1"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cx(
              'min-h-11 rounded-xl px-2 text-sm font-semibold',
              selected ? 'bg-card text-ink shadow-sm' : 'text-muted',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

export function PageHeader({
  title,
  subtitle,
  back,
  action,
}: {
  title: string
  subtitle?: string
  back?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-4 flex items-start gap-3">
      {back ? (
        <a href={back} className="grid size-12 shrink-0 place-items-center rounded-2xl border border-line bg-card" aria-label="Back">
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M15 18 9 12l6-6" />
          </svg>
        </a>
      ) : null}
      <div className="min-w-0 flex-1">
        <h1 className="font-display text-3xl leading-tight">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  )
}

export function Empty({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="rounded-3xl border border-dashed border-line bg-card px-4 py-8 text-center">
      <p className="text-lg font-semibold">{title}</p>
      <p className="mt-1 text-sm text-muted">{body}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}

export function NotFound({ title, body, href, action }: { title: string; body: string; href: string; action: string }) {
  return (
    <div className="rounded-3xl border border-line bg-card p-6 text-center">
      <h1 className="font-display text-3xl">{title}</h1>
      <p className="mt-2 text-muted">{body}</p>
      <a href={href} className={cx(buttonClass('primary'), 'mt-4')}>
        {action}
      </a>
    </div>
  )
}

export function Sheet({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}) {
  const titleId = useId()
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50">
      <button type="button" className="absolute inset-0 bg-black/50" aria-label="Close" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="absolute inset-x-0 bottom-0 max-h-[92dvh] overflow-y-auto rounded-t-3xl bg-card p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl md:inset-x-auto md:bottom-auto md:left-1/2 md:top-1/2 md:w-[34rem] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-3xl"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id={titleId} className="text-xl font-semibold">
            {title}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="grid size-12 place-items-center rounded-2xl border border-line">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  danger,
  onConfirm,
  onClose,
}: {
  open: boolean
  title: string
  body: string
  confirmLabel: string
  danger?: boolean
  onConfirm: () => void
  onClose: () => void
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[70] grid place-items-end p-4 sm:place-items-center">
      <button type="button" className="absolute inset-0 bg-black/50" aria-label="Close" onClick={onClose} />
      <div role="dialog" aria-modal="true" className="relative w-full max-w-md rounded-3xl bg-card p-5 shadow-2xl">
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="mt-2 text-sm text-muted">{body}</p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function Lightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[80] bg-black/92 p-4" onClick={onClose} role="dialog" aria-modal="true">
      <button type="button" className="absolute right-4 top-4 grid size-12 place-items-center rounded-full bg-white/10 text-white" aria-label="Close photo" onClick={onClose}>
        <X />
      </button>
      <img src={src} alt={alt} className="mx-auto max-h-full max-w-full object-contain" />
    </div>
  )
}
