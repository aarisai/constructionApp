import { useEffect, useState, type ReactNode } from 'react'
import { Building2, ClipboardList, Home, Moon, Plus, Sun, Users } from 'lucide-react'
import { useStore } from '../context/Store'
import { useTheme } from '../context/Theme'
import { QUICK_ENTRY_EVENT, type EntryType, type QuickEntryDetail } from '../lib/notify'
import type { Route } from '../lib/routes'
import { toHash } from '../lib/routes'
import { Logo } from './Logo'
import { QuickEntry } from './QuickEntry'
import { cx } from './ui'

export function Shell({ route, children }: { route: Route; children: ReactNode }) {
  const { state, error, clearError } = useStore()
  const { theme, toggle } = useTheme()
  const [online, setOnline] = useState(navigator.onLine)
  const [toast, setToast] = useState<string | null>(null)
  const [quick, setQuick] = useState<{ open: boolean; siteId?: string; type?: EntryType }>({ open: false })
  const chromeless = route.name === 'owner-report'
  const hideFab = chromeless || route.name === 'site-new' || route.name === 'site-edit' || quick.open
  const routeKey = toHash(route)

  useEffect(() => {
    const onOnline = () => setOnline(true)
    const onOffline = () => setOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  useEffect(() => {
    const onToast = (event: Event) => {
      const message = (event as CustomEvent<string>).detail
      setToast(message)
      window.setTimeout(() => setToast(null), 2400)
    }
    window.addEventListener('sankalpa-toast', onToast)
    return () => window.removeEventListener('sankalpa-toast', onToast)
  }, [])

  useEffect(() => {
    const onQuick = (event: Event) => {
      const detail = (event as CustomEvent<QuickEntryDetail>).detail ?? {}
      setQuick({ open: true, siteId: detail.siteId, type: detail.type })
    }
    window.addEventListener(QUICK_ENTRY_EVENT, onQuick)
    return () => window.removeEventListener(QUICK_ENTRY_EVENT, onQuick)
  }, [])

  useEffect(() => {
    setQuick({ open: false })
  }, [routeKey])

  return (
    <div className="min-h-dvh text-ink">
      {chromeless ? null : (
        <header className="no-print sticky top-0 z-30 border-b border-white/50 bg-paper/75 backdrop-blur-xl dark:border-white/10">
          <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
            <a href="#/" className="flex min-w-0 items-center gap-3">
              <Logo />
              <span className="min-w-0">
                <span className="block truncate font-display text-xl leading-none tracking-tight">{state.settings.businessName}</span>
                <span className="mt-1 block text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-brand">Bengaluru sites</span>
              </span>
            </a>
            <div className="ml-auto flex items-center gap-2">
              {online ? null : <span className="rounded-full bg-wait-soft px-2.5 py-1 text-xs font-semibold text-wait">Offline</span>}
              <button
                type="button"
                onClick={toggle}
                aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
                className="grid size-12 place-items-center rounded-2xl border border-line bg-card"
              >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
          </div>
        </header>
      )}
      {error ? (
        <div className="no-print mx-auto flex max-w-5xl items-start gap-3 px-4 pt-3">
          <p className="flex-1 rounded-2xl bg-due-soft px-3 py-3 text-sm font-medium text-due">{error}</p>
          <button type="button" onClick={clearError} className="min-h-12 px-2 text-sm font-semibold">
            Dismiss
          </button>
        </div>
      ) : null}
      <main className={cx('mx-auto w-full max-w-5xl px-4 py-4', chromeless ? '' : 'pb-40')}>{children}</main>
      {chromeless ? null : (
        <nav
          className="no-print fixed inset-x-3 bottom-[max(0.65rem,env(safe-area-inset-bottom))] z-30 mx-auto max-w-5xl rounded-[1.6rem] border border-white/60 bg-card/85 shadow-[0_16px_40px_-18px_rgba(36,24,40,0.45)] backdrop-blur-xl dark:border-white/10"
          aria-label="Primary"
        >
          <div className="grid grid-cols-4 p-1.5">
            <NavLink href="#/" label="Home" active={route.name === 'home'} icon={<Home size={22} />} />
            <NavLink
              href="#/sites"
              label="Sites"
              active={route.name === 'sites' || route.name === 'site' || route.name === 'site-new' || route.name === 'site-edit'}
              icon={<Building2 size={22} />}
            />
            <NavLink
              href="#/vendors"
              label="Vendors"
              active={route.name === 'vendors' || route.name === 'vendor'}
              icon={<Users size={22} />}
            />
            <NavLink
              href="#/reports"
              label="Reports"
              active={route.name === 'reports'}
              icon={<ClipboardList size={22} />}
            />
          </div>
        </nav>
      )}
      {hideFab ? null : (
        <button
          type="button"
          className="brand-gradient no-print fixed bottom-[calc(7rem+env(safe-area-inset-bottom))] right-4 z-40 grid size-14 place-items-center rounded-full ring-4 ring-white/80 dark:ring-white/15"
          aria-label="Log an entry"
          onClick={() => setQuick({ open: true })}
        >
          <Plus size={28} />
        </button>
      )}
      <QuickEntry
        open={quick.open}
        siteId={quick.siteId}
        type={quick.type}
        onClose={() => setQuick({ open: false })}
      />
      {toast ? (
        <div role="status" className="brand-gradient no-print fixed bottom-32 left-1/2 z-50 max-w-[90vw] -translate-x-1/2 rounded-full px-4 py-3 text-sm font-semibold shadow-lg">
          {toast}
        </div>
      ) : null}
    </div>
  )
}

function NavLink({ href, label, active, icon }: { href: string; label: string; active: boolean; icon: ReactNode }) {
  return (
    <a
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cx(
        'flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-2xl text-xs font-semibold',
        active ? 'bg-brand text-on-brand shadow-sm' : 'text-muted',
      )}
    >
      {icon}
      {label}
    </a>
  )
}
