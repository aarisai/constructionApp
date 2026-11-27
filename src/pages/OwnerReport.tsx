import { useState } from 'react'
import { useStore } from '../context/Store'
import {
  contractLabel,
  labourTrades,
  materialCategories,
  milestonePlan,
  siteMoney,
} from '../lib/calc'
import { formatArea, formatDate, formatINR, formatPhone, stageProgress, toISODate } from '../lib/format'
import { STAGES } from '../types'
import { Logo } from '../components/Logo'
import { SitePhoto } from '../components/SitePhoto'
import { NotFound } from '../components/ui'
import { coverSrc } from '../lib/covers'

export function OwnerReport({ id }: { id: string }) {
  const { state, photoUrl } = useStore()
  const site = state.sites.find((item) => item.id === id)
  const [breakdown, setBreakdown] = useState(false)
  if (!site) return <NotFound title="Site not found" body="This site is not on this phone." href="#/reports" action="Back to reports" />
  const money = siteMoney(state, site)
  const payments = state.ownerPayments
    .filter((payment) => payment.siteId === site.id)
    .sort((a, b) => a.date.localeCompare(b.date))
  const plan = site.contractType === 'fixed' ? milestonePlan(site, money.ownerReceived) : []
  const categories = materialCategories(state, site.id)
  const trades = labourTrades(state, site.id)
  const photos = state.progress
    .filter((update) => update.siteId === site.id)
    .sort((a, b) => b.date.localeCompare(a.date))
    .flatMap((update) => update.photoIds.map((photoId) => ({ photoId, update })))
    .filter((item) => photoUrl(item.photoId))
    .slice(0, 6)
  const stageIndex = STAGES.indexOf(site.stage)
  const settings = state.settings

  return (
    <div>
      <div className="no-print mb-4 flex flex-wrap items-center gap-2">
        <a href={`#/sites/${site.id}/owner`} className="inline-flex min-h-12 items-center rounded-2xl border border-line bg-card px-4 font-semibold">
          Back
        </a>
        <button type="button" className="brand-gradient inline-flex min-h-12 items-center rounded-2xl px-4 font-semibold" onClick={() => window.print()}>
          Generate PDF
        </button>
        {site.contractType === 'cost-plus' ? (
          <label className="inline-flex min-h-12 items-center gap-2 rounded-2xl border border-line bg-card px-3 text-sm font-semibold">
            <input type="checkbox" className="size-5" checked={breakdown} onChange={(event) => setBreakdown(event.target.checked)} />
            Include cost breakdown
          </label>
        ) : null}
      </div>
      {site.contractType === 'cost-plus' ? (
        <p className="no-print mb-4 text-sm text-muted">Shows material categories and labour trades. Supplier names stay off this statement. In the print dialog, choose Save as PDF.</p>
      ) : (
        <p className="no-print mb-4 text-sm text-muted">In the print dialog, choose Save as PDF. Supplier names and your costs stay off this statement.</p>
      )}
      <article className="report-paper mx-auto max-w-3xl rounded-3xl p-6 shadow-sm sm:p-8">
        <header className="report-block flex items-center gap-4 rounded-2xl bg-brand px-5 py-5 text-on-brand">
          <Logo className="size-14" />
          <div>
            <p className="font-display text-3xl leading-tight">{settings.businessName}</p>
            <p className="mt-1 text-sm">{settings.tagline}</p>
            <p className="mt-3 text-sm">{settings.address}</p>
            {settings.phone ? <p className="text-sm">{formatPhone(settings.phone)}</p> : null}
          </div>
        </header>
        <div className="report-block mt-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-wide text-muted">OWNER STATEMENT</p>
            <h1 className="font-display text-4xl leading-tight">{site.name}</h1>
          </div>
          <p className="text-sm">{formatDate(toISODate(new Date()))}</p>
        </div>
        <SitePhoto src={coverSrc(site)} alt="" className="report-block mt-5 h-48 w-full rounded-2xl object-cover" />
        <section className="report-block mt-6 grid gap-3 border-y border-line py-4 sm:grid-cols-2">
          <p>
            <span className="block text-xs font-semibold text-muted">Owner</span>
            {site.ownerName}
            <br />
            {formatPhone(site.ownerPhone)}
          </p>
          <p>
            <span className="block text-xs font-semibold text-muted">Site</span>
            {site.locality}, Bengaluru
            <br />
            {[site.plotSize, formatArea(site.areaSqFt)].filter(Boolean).join(' · ')}
          </p>
          <p>
            <span className="block text-xs font-semibold text-muted">Started</span>
            {formatDate(site.startDate)}
          </p>
          <p>
            <span className="block text-xs font-semibold text-muted">Contract</span>
            {contractLabel(site)}
            {site.contractType === 'fixed' && site.fixedPricing === 'rate' ? ` · ${formatINR(site.ratePerSqFt)} / sq.ft` : ''}
          </p>
        </section>
        <section className="report-block mt-6">
          <div className="mb-2 flex justify-between text-sm">
            <span className="font-semibold">Current stage · {site.stage}</span>
            <span>{stageProgress(site.stage)}%</span>
          </div>
          <div className="flex gap-1">
            {STAGES.map((stage, index) => (
              <div key={stage} className={index <= stageIndex ? 'h-2 flex-1 rounded-full bg-brand' : 'h-2 flex-1 rounded-full bg-line'} title={stage} />
            ))}
          </div>
        </section>
        {site.contractType === 'fixed' ? (
          <section className="report-block mt-6">
            <h2 className="font-semibold">Agreed stages</h2>
            <table className="mt-2 w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line text-muted">
                  <th className="py-2 font-semibold">Stage</th>
                  <th className="py-2 text-right font-semibold">Agreed</th>
                  <th className="py-2 text-right font-semibold">Received</th>
                  <th className="py-2 text-right font-semibold">Balance</th>
                </tr>
              </thead>
              <tbody>
                {plan.map((row) => (
                  <tr key={row.id} className="border-b border-line">
                    <td className="py-2">{row.name}</td>
                    <td className="py-2 text-right tabular-nums">{formatINR(row.amount)}</td>
                    <td className="py-2 text-right tabular-nums">{formatINR(row.received)}</td>
                    <td className="py-2 text-right tabular-nums">{formatINR(row.pending)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : (
          <section className="report-block mt-6">
            <h2 className="font-semibold">Contract</h2>
            <p className="mt-1 text-sm">Cost-plus at {site.feePercent}% on material and labour logged to date.</p>
            {breakdown ? (
              <table className="mt-3 w-full text-left text-sm">
                <tbody>
                  {categories.map((line) => (
                    <tr key={line.label} className="border-b border-line">
                      <td className="py-2">{line.label}</td>
                      <td className="py-2 text-right tabular-nums">{formatINR(line.amount)}</td>
                    </tr>
                  ))}
                  {trades.map((line) => (
                    <tr key={line.label} className="border-b border-line">
                      <td className="py-2">Labour · {line.label}</td>
                      <td className="py-2 text-right tabular-nums">{formatINR(line.amount)}</td>
                    </tr>
                  ))}
                  <tr className="border-b border-line">
                    <td className="py-2">Contractor fee {site.feePercent}%</td>
                    <td className="py-2 text-right tabular-nums">{formatINR(money.feeOrMargin)}</td>
                  </tr>
                </tbody>
              </table>
            ) : null}
          </section>
        )}
        <section className="report-block mt-6">
          <h2 className="font-semibold">Payments received</h2>
          {payments.length === 0 ? <p className="mt-2 text-sm">No payments received yet.</p> : null}
          {payments.length > 0 ? (
            <table className="mt-2 w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line text-muted">
                  <th className="py-2 font-semibold">Date</th>
                  <th className="py-2 font-semibold">Mode</th>
                  <th className="py-2 font-semibold">Reference</th>
                  <th className="py-2 text-right font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b border-line">
                    <td className="py-2">{formatDate(payment.date)}</td>
                    <td className="py-2">{payment.mode}</td>
                    <td className="py-2">{payment.reference || '—'}</td>
                    <td className="py-2 text-right tabular-nums">{formatINR(payment.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </section>
        <section className="report-block mt-6 rounded-2xl border border-line px-4 py-4">
          <p className="text-sm font-semibold text-muted">Net balance payable by owner</p>
          <p className="mt-1 font-display text-4xl tabular-nums">{formatINR(money.ownerPending)}</p>
          <p className="mt-2 text-sm">
            Bill {formatINR(money.billable)} · received {formatINR(money.ownerReceived)}
            {money.overpaid > 0 ? ` · ${formatINR(money.overpaid)} received ahead of the current bill` : ''}
          </p>
        </section>
        {photos.length > 0 ? (
          <section className="mt-6">
            <h2 className="report-block font-semibold">Recent site progress</h2>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {photos.map((item) => {
                const src = photoUrl(item.photoId)
                if (!src) return null
                return (
                  <figure key={item.photoId} className="report-block">
                    <img src={src} alt={`${item.update.stage} on ${formatDate(item.update.date)}`} className="aspect-[3/2] w-full rounded-xl object-cover" />
                    <figcaption className="mt-1 text-xs text-muted">
                      {formatDate(item.update.date)} · {item.update.stage}
                      <br />
                      {item.update.note}
                    </figcaption>
                  </figure>
                )
              })}
            </div>
          </section>
        ) : null}
        <footer className="mt-8 border-t border-line pt-4 text-xs text-muted">
          This is a running statement for the site owner, not a tax invoice. It does not include supplier credit or internal rates.
          <br />
          For {settings.businessName}
        </footer>
      </article>
    </div>
  )
}
