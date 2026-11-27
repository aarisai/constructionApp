import { useEffect, useState } from 'react'
import { dashboardSummary, siteMoney } from '../lib/calc'
import { formatDate, formatINR, toISODate } from '../lib/format'
import { toHash } from '../lib/routes'
import { useStore } from '../context/Store'
import { Logo } from '../components/Logo'
import { SiteCard } from '../components/SiteCard'
import { Badge, buttonClass } from '../components/ui'

export function Dashboard() {
  const { state, dismissSample } = useStore()
  const summary = dashboardSummary(state)
  const sites = state.sites
    .filter((site) => site.active)
    .sort((a, b) => siteMoney(state, b).ownerPending - siteMoney(state, a).ownerPending)
  const overdue = summary.dueSoon.some((item) => item.days <= 0)
  const dueAmount = summary.dueSoon.reduce((total, item) => total + item.pending, 0)

  return (
    <div className="space-y-4">
      <header>
        <p className="text-sm text-muted">{formatDate(toISODate(new Date()))}</p>
        <h1 className="font-display text-4xl leading-none">Today</h1>
      </header>
      <section className="grid grid-cols-2 gap-3">
        <article className="rounded-3xl bg-cash-soft p-4">
          <h2 className="text-sm font-semibold text-cash">Received</h2>
          <p className="mt-2 text-xl font-semibold tabular-nums text-cash">{formatINR(summary.cashIn)}</p>
          <p className="mt-1 text-xs text-muted">Money in, all sites</p>
        </article>
        <article className="rounded-3xl bg-out-soft p-4">
          <h2 className="text-sm font-semibold text-out">Spent</h2>
          <p className="mt-2 text-xl font-semibold tabular-nums text-out">{formatINR(summary.cashOut)}</p>
          <p className="mt-1 text-xs text-muted">Money out, all sites</p>
        </article>
      </section>
      <p className="text-sm">
        Left after spend{' '}
        <strong className={summary.netCash >= 0 ? 'text-cash' : 'text-out'}>{formatINR(summary.netCash)}</strong>
      </p>
      <SiteSummary />
      {state.sampleBanner ? (
        <div className="flex gap-3 rounded-[1.5rem] border border-white/70 bg-card/90 p-4">
          <Logo className="size-12" />
          <div>
            <p className="font-semibold">Sample sites are loaded</p>
            <p className="mt-1 text-sm text-muted">Lakshmi Nilaya in JP Nagar and Oakridge Residence in Whitefield. Clear them from Reports when you start your own book.</p>
            <button type="button" onClick={dismissSample} className="mt-3 min-h-11 text-sm font-semibold text-brand">
              Dismiss
            </button>
          </div>
        </div>
      ) : null}
      <InstallHint />
      <section className="grid grid-cols-2 gap-3">
        <article className="rounded-3xl border border-line bg-card p-4">
          <h2 className="text-sm font-semibold text-cash">Still to receive</h2>
          <p className="mt-2 text-xl font-semibold tabular-nums text-cash">{formatINR(summary.ownerPending)}</p>
          <p className="mt-1 text-xs text-muted">Owners, active sites</p>
        </article>
        <article className="rounded-3xl border border-line bg-card p-4">
          <h2 className="text-sm font-semibold text-out">Still to pay</h2>
          <p className="mt-2 text-xl font-semibold tabular-nums text-out">{formatINR(summary.payablePending)}</p>
          <p className="mt-1 text-xs text-muted">Vendors and mestris</p>
        </article>
      </section>
      <section className={overdue ? 'rounded-3xl bg-due-soft p-4' : summary.dueSoon.length > 0 ? 'rounded-3xl bg-wait-soft p-4' : 'rounded-3xl bg-cash-soft p-4'}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">Credit due in 7 days</h2>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{formatINR(dueAmount)}</p>
            <p className="mt-1 text-sm">{summary.dueSoon.length === 0 ? 'No material bills due in the next 7 days.' : `${summary.dueSoon.length} open ${summary.dueSoon.length === 1 ? 'bill' : 'bills'}`}</p>
          </div>
          <Badge tone={overdue ? 'due' : summary.dueSoon.length > 0 ? 'wait' : 'cash'}>{overdue ? 'Overdue' : summary.dueSoon.length > 0 ? 'Due soon' : 'Clear'}</Badge>
        </div>
        {summary.dueSoon.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {summary.dueSoon.map((item) => (
              <li key={item.billId}>
                <a href={toHash({ name: 'vendor', id: item.vendorId })} className="block rounded-2xl bg-card px-3 py-3">
                  <span className="block font-semibold">{item.vendorName}</span>
                  <span className="mt-0.5 block text-sm text-muted">
                    {item.siteName} · {item.category} · {formatINR(item.pending)}
                  </span>
                  <span className={item.days <= 0 ? 'mt-1 block text-sm font-semibold text-due' : 'mt-1 block text-sm font-semibold text-wait'}>
                    {item.label}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
      {summary.advanceUnused > 0 ? (
        <p className="rounded-2xl bg-wait-soft px-3 py-3 text-sm text-wait">
          Supplier advances not yet adjusted: <strong>{formatINR(summary.advanceUnused)}</strong>
        </p>
      ) : null}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Active sites</h2>
          <a href="#/sites" className="text-sm font-semibold text-brand">
            All sites
          </a>
        </div>
        {sites.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-line bg-card px-4 py-8 text-center">
            <p className="font-semibold">No active sites</p>
            <p className="mt-1 text-sm text-muted">Add a house or apartment block to start tracking money.</p>
            <a href="#/sites/new" className={`${buttonClass('primary')} mt-4`}>
              Add site
            </a>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {sites.map((site) => (
              <SiteCard key={site.id} site={site} />
            ))}
          </div>
        )}
      </section>
      <p className="text-center text-xs text-muted">Saved on this phone. Export a backup from Reports before you clear the browser.</p>
    </div>
  )
}

function SiteSummary() {
  const { state } = useStore()
  const sites = state.sites.slice().sort((a, b) => Number(b.active) - Number(a.active) || siteMoney(state, b).cashIn - siteMoney(state, a).cashIn)
  if (sites.length === 0) return null
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">By site</h2>
      <ul className="space-y-3">
        {sites.map((site) => {
          const money = siteMoney(state, site)
          const scale = Math.max(money.cashIn, money.cashOut, 1)
          return (
            <li key={site.id}>
              <a href={toHash({ name: 'site', id: site.id, tab: 'owner' })} className="block rounded-3xl border border-line bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold">{site.name}</h3>
                  <span className="text-sm text-muted">{site.locality}</span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs font-semibold text-cash">Received</p>
                    <p className="mt-1 font-semibold tabular-nums text-cash">{formatINR(money.cashIn)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-out">Spent</p>
                    <p className="mt-1 font-semibold tabular-nums text-out">{formatINR(money.cashOut)}</p>
                  </div>
                </div>
                <div className="mt-3 space-y-1.5" aria-hidden="true">
                  <div className="h-2 overflow-hidden rounded-full bg-line">
                    <div className="h-full rounded-full bg-cash" style={{ width: `${Math.min(100, (money.cashIn / scale) * 100)}%` }} />
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-line">
                    <div className="h-full rounded-full bg-out" style={{ width: `${Math.min(100, (money.cashOut / scale) * 100)}%` }} />
                  </div>
                </div>
              </a>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function InstallHint() {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null)
  const [hidden, setHidden] = useState(() => sessionStorage.getItem('sankalpa-install-hide') === '1')
  const standalone = window.matchMedia('(display-mode: standalone)').matches

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault()
      setPrompt(event as InstallPrompt)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  if (standalone || hidden || !prompt) return null
  return (
    <div className="rounded-[1.5rem] border border-white/70 bg-card/90 p-4">
      <p className="font-semibold">Install on this phone</p>
      <p className="mt-1 text-sm text-muted">Open it like an app. Your sites stay on this phone, even offline.</p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          className={buttonClass('primary')}
          onClick={async () => {
            await prompt.prompt()
            setPrompt(null)
          }}
        >
          Install
        </button>
        <button
          type="button"
          className={buttonClass('secondary')}
          onClick={() => {
            sessionStorage.setItem('sankalpa-install-hide', '1')
            setHidden(true)
          }}
        >
          Not now
        </button>
      </div>
    </div>
  )
}

interface InstallPrompt extends Event {
  prompt: () => Promise<void>
}
