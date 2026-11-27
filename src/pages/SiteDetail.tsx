import { useState } from 'react'
import { useStore } from '../context/Store'
import { Thumb } from '../components/PhotoPicker'
import { KharchiForm, LabourContractForm } from '../components/forms/LabourForm'
import { MaterialBillForm } from '../components/forms/MaterialBillForm'
import { OwnerPaymentForm } from '../components/forms/OwnerPaymentForm'
import { ProgressForm } from '../components/forms/ProgressForm'
import { RequestForm } from '../components/forms/RequestForm'
import { VendorPayForm } from '../components/forms/VendorPayForm'
import { SitePhoto } from '../components/SitePhoto'
import { Badge, buttonClass, ConfirmDialog, Meter, Money, NotFound, Sheet, cx } from '../components/ui'
import { coverSrc } from '../lib/covers'
import {
  billPending,
  contractLabel,
  contractRemaining,
  materialCategories,
  milestonePlan,
  siteMoney,
  vendorName,
} from '../lib/calc'
import { dueLabel, daysFromToday, formatArea, formatDate, formatINR, formatPhone, formatQty, stageProgress } from '../lib/format'
import { paceNotes } from '../lib/pace'
import { notify } from '../lib/notify'
import { requirementMessage, whatsappLink } from '../lib/whatsapp'
import { SITE_TABS, toHash, type SiteTab } from '../lib/routes'
import type { Site } from '../types'

type SheetState =
  | { kind: 'owner' }
  | { kind: 'owner-edit'; id: string }
  | { kind: 'bill' }
  | { kind: 'bill-edit'; id: string }
  | { kind: 'bill-pay'; id: string }
  | { kind: 'contract' }
  | { kind: 'contract-edit'; id: string }
  | { kind: 'kharchi'; contractId: string }
  | { kind: 'kharchi-edit'; id: string }
  | { kind: 'payout'; contractId: string }
  | { kind: 'progress' }
  | { kind: 'request' }
  | { kind: 'request-edit'; id: string }
  | null

const TAB_LABEL: Record<SiteTab, string> = {
  owner: 'Owner',
  needs: 'Needs',
  material: 'Material',
  labour: 'Labour',
  progress: 'Week',
}

export function SiteDetail({ id, tab }: { id: string; tab: SiteTab }) {
  const store = useStore()
  const site = store.state.sites.find((item) => item.id === id)
  const [sheet, setSheet] = useState<SheetState>(null)
  const [confirm, setConfirm] = useState<null | { title: string; body: string; run: () => void }>(null)
  if (!site) return <NotFound title="Site not found" body="This site is not on this phone." href="#/sites" action="Back to sites" />
  const place = [site.plotSize, formatArea(site.areaSqFt)].filter(Boolean).join(' · ')

  return (
    <div>
      <section className="relative -mx-4 -mt-4 mb-4 h-64 overflow-hidden sm:h-72 sm:rounded-b-[1.75rem]">
        <SitePhoto src={coverSrc(site)} alt={`${site.name}, ${site.locality}`} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/20" />
        <div className="absolute inset-x-0 top-3 flex items-center justify-between px-4">
          <a href="#/sites" className="grid size-12 place-items-center rounded-2xl bg-white/92 text-[#241828]" aria-label="Back">
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M15 18 9 12l6-6" />
            </svg>
          </a>
          <a href={toHash({ name: 'site-edit', id: site.id })} className={cx(buttonClass('secondary'), 'bg-white/92')}>
            Edit
          </a>
        </div>
        <div className="absolute inset-x-0 bottom-0 px-4 pb-4 text-white">
          <div className="mb-2 flex flex-wrap gap-2">
            <span className="rounded-full bg-white/92 px-2.5 py-1 text-xs font-semibold text-[#241828]">{contractLabel(site)}</span>
            <span className="rounded-full bg-black/40 px-2.5 py-1 text-xs font-semibold">{site.stage}</span>
            {site.active ? null : <span className="rounded-full bg-[#a15c00] px-2.5 py-1 text-xs font-semibold">Inactive</span>}
          </div>
          <h1 className="font-display text-4xl leading-none">{site.name}</h1>
          <p className="mt-1 text-sm text-white/85">
            {site.locality} · {place}
          </p>
        </div>
      </section>
      <div className="mb-3">
        <div className="mb-1 flex justify-between text-sm">
          <span>{site.stage}</span>
          <span className="tabular-nums">{stageProgress(site.stage)}%</span>
        </div>
        <Meter value={stageProgress(site.stage)} max={100} tone="brand" />
      </div>
      <p className="mb-4 text-sm text-muted">
        {site.ownerName} · <a className="font-semibold" href={`tel:${site.ownerPhone}`}>{formatPhone(site.ownerPhone)}</a>
      </p>
      <div className="sticky top-[4.6rem] z-20 -mx-4 mb-4 bg-paper/80 px-4 py-2 backdrop-blur-xl">
        <div className="grid grid-cols-5 gap-1 rounded-2xl bg-white/70 p-1 shadow-sm dark:bg-white/10">
          {SITE_TABS.map((item) => (
            <a
              key={item}
              href={toHash({ name: 'site', id: site.id, tab: item })}
              className={cx(
                'grid min-h-11 place-items-center rounded-xl px-1 text-xs font-semibold',
                tab === item ? 'bg-brand text-on-brand shadow-sm' : 'text-muted',
              )}
              aria-current={tab === item ? 'page' : undefined}
            >
              {TAB_LABEL[item]}
            </a>
          ))}
        </div>
      </div>
      {tab === 'owner' ? <OwnerTab site={site} onSheet={setSheet} onDelete={askDelete} /> : null}
      {tab === 'needs' ? <NeedsTab site={site} onSheet={setSheet} onDelete={askDelete} /> : null}
      {tab === 'material' ? <MaterialTab site={site} onSheet={setSheet} onDelete={askDelete} /> : null}
      {tab === 'labour' ? <LabourTab site={site} onSheet={setSheet} onDelete={askDelete} /> : null}
      {tab === 'progress' ? <ProgressTab site={site} onSheet={setSheet} onDelete={askDelete} /> : null}
      <p className="mt-4 text-center text-sm">
        <a className="font-semibold" href={toHash({ name: 'owner-report', id: site.id })}>
          Generate owner statement
        </a>
      </p>
      <EntrySheet sheet={sheet} site={site} onClose={() => setSheet(null)} />
      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.title ?? ''}
        body={confirm?.body ?? ''}
        confirmLabel="Delete"
        danger
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          confirm?.run()
          setConfirm(null)
        }}
      />
    </div>
  )

  function askDelete(title: string, body: string, run: () => void) {
    setConfirm({ title, body, run })
  }
}

function OwnerTab({
  site,
  onSheet,
  onDelete,
}: {
  site: Site
  onSheet: (sheet: SheetState) => void
  onDelete: (title: string, body: string, run: () => void) => void
}) {
  const store = useStore()
  const money = siteMoney(store.state, site)
  const payments = store.state.ownerPayments
    .filter((payment) => payment.siteId === site.id)
    .sort((a, b) => b.date.localeCompare(a.date))
  const plan = site.contractType === 'fixed' ? milestonePlan(site, money.ownerReceived) : []
  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-3xl bg-card">
        <div className="grid grid-cols-2">
          <div className="h-1.5 bg-cash" />
          <div className="h-1.5 bg-out" />
        </div>
        <div className="p-4">
        <p className="text-sm font-semibold text-cash">Still to receive</p>
        <p className="mt-1 text-3xl font-semibold tabular-nums text-cash">{formatINR(money.ownerPending)}</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-cash-soft px-3 py-2">
            <p className="text-xs font-semibold text-cash">Received</p>
            <p className="mt-1 font-semibold tabular-nums text-cash">{formatINR(money.ownerReceived)}</p>
          </div>
          <div className="rounded-2xl bg-out-soft px-3 py-2">
            <p className="text-xs font-semibold text-out">Spent</p>
            <p className="mt-1 font-semibold tabular-nums text-out">{formatINR(money.cashOut)}</p>
          </div>
        </div>
        <p className="mt-3 text-sm text-muted">Bill {formatINR(money.billable)}</p>
        <div className="mt-3">
          <Meter value={money.ownerReceived} max={Math.max(money.billable, 1)} tone="cash" />
        </div>
        {money.overpaid > 0 ? <p className="mt-2 text-sm text-wait">Received {formatINR(money.overpaid)} more than the current bill.</p> : null}
        </div>
      </section>
      {site.contractType === 'fixed' ? (
        <section className="rounded-3xl border border-line bg-card p-4">
          <h2 className="font-semibold">Stage schedule</h2>
          <ul className="mt-3 space-y-3">
            {plan.map((row) => (
              <li key={row.id}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{row.name}</span>
                  <Badge tone={row.state === 'cleared' ? 'cash' : row.state === 'partial' ? 'wait' : 'neutral'}>
                    {row.state === 'cleared' ? 'Cleared' : row.state === 'partial' ? 'Partial' : 'Due'}
                  </Badge>
                </div>
                <p className="text-sm text-muted">
                  {formatINR(row.received)} of {formatINR(row.amount)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <section className="rounded-3xl border border-line bg-card p-4">
          <h2 className="font-semibold">Cost-plus bill</h2>
          <p className="mt-1 text-sm text-muted">Materials + labour + your {site.feePercent}% fee. It updates as you log costs.</p>
          <dl className="mt-3 space-y-2 text-sm">
            <Row label="Materials" value={money.materialCost} />
            <Row label="Labour" value={money.labourCost} />
            <Row label={`Fee ${site.feePercent}%`} value={money.feeOrMargin} />
            <Row label="Owner bill" value={money.billable} strong />
          </dl>
          {materialCategories(store.state, site.id).length === 0 ? null : (
            <p className="mt-3 text-xs text-muted">Supplier names stay on the material tab. The owner statement can hide this split.</p>
          )}
        </section>
      )}
      <button type="button" className={buttonClass('primary', true)} onClick={() => onSheet({ kind: 'owner' })}>
        Log owner payment
      </button>
      {payments.length === 0 ? <p className="text-sm text-muted">No payments received yet.</p> : null}
      <ul className="space-y-2">
        {payments.map((payment) => (
          <li key={payment.id} className="rounded-2xl border border-line bg-card p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{formatDate(payment.date)}</p>
                <p className="text-sm text-muted">
                  {payment.mode}
                  {payment.reference ? ` · ${payment.reference}` : ''}
                </p>
                {payment.note ? <p className="text-sm">{payment.note}</p> : null}
              </div>
              <Money value={payment.amount} tone="cash" />
            </div>
            {payment.photoId ? (
              <div className="mt-2">
                <Thumb id={payment.photoId} alt="UPI payment screenshot" />
              </div>
            ) : null}
            <div className="mt-2 flex gap-2">
              <button type="button" className="min-h-11 px-2 text-sm font-semibold" onClick={() => onSheet({ kind: 'owner-edit', id: payment.id })}>
                Edit
              </button>
              <button
                type="button"
                className="min-h-11 px-2 text-sm font-semibold text-due"
                onClick={() =>
                  onDelete('Delete this payment?', 'The pending amount from the owner will go up.', () => {
                    store.deleteOwnerPayment(payment.id)
                    notify('Payment deleted')
                  })
                }
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function MaterialTab({
  site,
  onSheet,
  onDelete,
}: {
  site: Site
  onSheet: (sheet: SheetState) => void
  onDelete: (title: string, body: string, run: () => void) => void
}) {
  const store = useStore()
  const bills = store.state.materialBills
    .filter((bill) => bill.siteId === site.id)
    .sort((a, b) => b.date.localeCompare(a.date))
  const billed = bills.reduce((total, bill) => total + bill.totalAmount, 0)
  const pending = bills.reduce((total, bill) => total + billPending(store.state, bill), 0)
  return (
    <div className="space-y-4">
      <section className="grid grid-cols-3 gap-2">
        <Mini label="Billed" value={billed} />
        <Mini label="Settled" value={billed - pending} />
        <Mini label="Pending" value={pending} outbound />
      </section>
      <button type="button" className={buttonClass('primary', true)} onClick={() => onSheet({ kind: 'bill' })}>
        Log material bill
      </button>
      {bills.length === 0 ? <p className="text-sm text-muted">No material bills yet.</p> : null}
      <ul className="space-y-2">
        {bills.map((bill) => {
          const left = billPending(store.state, bill)
          const days = bill.creditDueDate ? daysFromToday(bill.creditDueDate) : null
          const badge = left <= 0 ? { text: 'Paid', tone: 'cash' as const } : days == null ? { text: 'No due date', tone: 'wait' as const } : dueLabel(days).text ? dueLabel(days) : { text: formatDate(bill.creditDueDate ?? ''), tone: 'neutral' as const }
          return (
            <li key={bill.id} className="rounded-2xl border border-line bg-card p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{bill.category}</p>
                  <p className="text-sm text-muted">
                    {vendorName(store.state, bill.vendorId)} · {formatQty(bill.quantity, bill.unit)}
                  </p>
                  <p className="text-sm text-muted">{formatDate(bill.date)}</p>
                </div>
                <Money value={left > 0 ? left : bill.totalAmount} tone={left > 0 ? 'out' : 'cash'} />
              </div>
              <div className="mt-2">
                <Badge tone={badge.tone}>{badge.text}</Badge>
              </div>
              {bill.note ? <p className="mt-2 text-sm">{bill.note}</p> : null}
              {bill.photoId ? (
                <div className="mt-2">
                  <Thumb id={bill.photoId} alt="Delivery challan" />
                </div>
              ) : null}
              <div className="mt-2 flex flex-wrap gap-2">
                {left > 0 ? (
                  <button type="button" className="min-h-11 px-2 text-sm font-semibold" onClick={() => onSheet({ kind: 'bill-pay', id: bill.id })}>
                    Record payment
                  </button>
                ) : null}
                <button type="button" className="min-h-11 px-2 text-sm font-semibold" onClick={() => onSheet({ kind: 'bill-edit', id: bill.id })}>
                  Edit
                </button>
                <button
                  type="button"
                  className="min-h-11 px-2 text-sm font-semibold text-due"
                  onClick={() =>
                    onDelete('Delete this bill?', 'Pending dues for this supplier will change.', () => {
                      store.deleteMaterialBill(bill.id)
                      notify('Bill deleted')
                    })
                  }
                >
                  Delete
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function LabourTab({
  site,
  onSheet,
  onDelete,
}: {
  site: Site
  onSheet: (sheet: SheetState) => void
  onDelete: (title: string, body: string, run: () => void) => void
}) {
  const store = useStore()
  const contracts = store.state.labourContracts.filter((contract) => contract.siteId === site.id)
  return (
    <div className="space-y-4">
      <button type="button" className={buttonClass('primary', true)} onClick={() => onSheet({ kind: 'contract' })}>
        Add lump-sum contract
      </button>
      {contracts.length === 0 ? <p className="text-sm text-muted">No labour contracts on this site yet.</p> : null}
      <ul className="space-y-3">
        {contracts.map((contract) => {
          const left = contractRemaining(store.state, contract)
          const entries = store.state.kharchi
            .filter((entry) => entry.contractId === contract.id)
            .sort((a, b) => b.date.localeCompare(a.date))
          return (
            <li key={contract.id} className="rounded-3xl border border-line bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{vendorName(store.state, contract.vendorId)}</p>
                  <p className="text-sm text-muted">{contract.trade}</p>
                </div>
                <Badge tone={left === 0 ? 'cash' : 'wait'}>{left === 0 ? 'Settled' : 'Open'}</Badge>
              </div>
              <p className="mt-2 text-sm">
                {formatINR(contract.lumpSum - left)} paid of {formatINR(contract.lumpSum)}
              </p>
              <div className="mt-2">
                <Meter value={contract.lumpSum - left} max={contract.lumpSum} tone="cash" />
              </div>
              <p className="mt-2 text-sm font-semibold text-out">{formatINR(left)} left</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {left > 0 ? (
                  <button type="button" className={buttonClass('primary')} onClick={() => onSheet({ kind: 'kharchi', contractId: contract.id })}>
                    Log kharchi
                  </button>
                ) : null}
                {left > 0 ? (
                  <button type="button" className={buttonClass('secondary')} onClick={() => onSheet({ kind: 'payout', contractId: contract.id })}>
                    Record payout
                  </button>
                ) : null}
              </div>
              <div className="mt-2 flex gap-2">
                <button type="button" className="min-h-11 px-2 text-sm font-semibold" onClick={() => onSheet({ kind: 'contract-edit', id: contract.id })}>
                  Edit contract
                </button>
                <button
                  type="button"
                  className="min-h-11 px-2 text-sm font-semibold text-due"
                  onClick={() =>
                    onDelete('Delete this contract?', 'Weekly kharchi logged against it will be removed.', () => {
                      store.deleteLabourContract(contract.id)
                      notify('Contract deleted')
                    })
                  }
                >
                  Delete
                </button>
              </div>
              {entries.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {entries.map((entry) => (
                    <li key={entry.id} className="rounded-2xl bg-paper px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm">
                          {formatDate(entry.date)} · {entry.mode}
                        </span>
                        <span className="font-semibold tabular-nums">{formatINR(entry.amount)}</span>
                      </div>
                      {entry.note ? <p className="text-sm text-muted">{entry.note}</p> : null}
                      <div className="mt-1 flex gap-2">
                        <button type="button" className="min-h-11 text-sm font-semibold" onClick={() => onSheet({ kind: 'kharchi-edit', id: entry.id })}>
                          Edit
                        </button>
                        <button
                          type="button"
                          className="min-h-11 text-sm font-semibold text-due"
                          onClick={() =>
                            onDelete('Delete this kharchi?', 'It will be added back to the contract balance.', () => {
                              store.deleteKharchi(entry.id)
                              notify('Kharchi deleted')
                            })
                          }
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-muted">No kharchi yet. Saturday advances show up here and reduce the balance.</p>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function NeedsTab({
  site,
  onSheet,
  onDelete,
}: {
  site: Site
  onSheet: (sheet: SheetState) => void
  onDelete: (title: string, body: string, run: () => void) => void
}) {
  const store = useStore()
  const requests = (store.state.materialRequests ?? [])
    .filter((request) => request.siteId === site.id)
    .sort((a, b) => b.date.localeCompare(a.date))
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">Write the materials and quantities, link the supplier’s WhatsApp number, then send the list from here.</p>
      <button type="button" className={buttonClass('primary', true)} onClick={() => onSheet({ kind: 'request' })}>
        New material list
      </button>
      {requests.length === 0 ? <p className="text-sm text-muted">No lists yet.</p> : null}
      <ul className="space-y-3">
        {requests.map((request) => {
          const vendor = request.vendorId ? store.state.vendors.find((item) => item.id === request.vendorId) : undefined
          const message = requirementMessage({
            businessName: store.state.settings.businessName,
            siteName: site.name,
            locality: site.locality,
            note: request.note,
            items: request.items,
          })
          const link = whatsappLink(request.whatsapp, message)
          return (
            <li key={request.id} className="rounded-3xl border border-line bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{vendor?.name ?? 'Supplier'}</p>
                  <p className="text-sm text-muted">
                    {formatPhone(request.whatsapp)} · needed {formatDate(request.date)}
                  </p>
                </div>
                {request.lastSentAt ? <Badge tone="cash">Sent</Badge> : <Badge tone="neutral">Not sent</Badge>}
              </div>
              <ul className="mt-3 space-y-1 text-sm">
                {request.items.map((item) => (
                  <li key={item.id}>
                    {item.material} · {formatQty(item.quantity, item.unit)}
                    {item.note ? <span className="text-muted"> · {item.note}</span> : null}
                  </li>
                ))}
              </ul>
              {request.note ? <p className="mt-2 text-sm text-muted">{request.note}</p> : null}
              <div className="mt-3 flex flex-wrap gap-2">
                {link ? (
                  <a
                    className={buttonClass('primary')}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => store.saveRequest({ ...request, lastSentAt: new Date().toISOString() })}
                  >
                    Send on WhatsApp
                  </a>
                ) : (
                  <p className="text-sm text-due">Add a 10-digit WhatsApp number before sending.</p>
                )}
                <button type="button" className={buttonClass('secondary')} onClick={() => onSheet({ kind: 'request-edit', id: request.id })}>
                  Edit
                </button>
                <button
                  type="button"
                  className="min-h-12 px-2 text-sm font-semibold text-due"
                  onClick={() =>
                    onDelete('Delete this material list?', 'The list is removed from this phone. A message already sent on WhatsApp stays in that chat.', () => {
                      store.deleteRequest(request.id)
                      notify('Material list deleted')
                    })
                  }
                >
                  Delete
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function ProgressTab({
  site,
  onSheet,
  onDelete,
}: {
  site: Site
  onSheet: (sheet: SheetState) => void
  onDelete: (title: string, body: string, run: () => void) => void
}) {
  const store = useStore()
  const updates = store.state.progress
    .filter((update) => update.siteId === site.id)
    .sort((a, b) => b.date.localeCompare(a.date))
  const notes = paceNotes(updates, site)
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">Post each week’s work with pictures. The notes below use those dates to show where time is going.</p>
      <button type="button" className={buttonClass('primary', true)} onClick={() => onSheet({ kind: 'progress' })}>
        Log this week
      </button>
      <section className="rounded-3xl border border-line bg-card p-4">
        <h2 className="font-semibold">What to tighten</h2>
        <ul className="mt-3 space-y-3">
          {notes.map((note, index) => (
            <li key={`${note.title}-${index}`}>
              <p className="font-medium">{note.title}</p>
              <p className="text-sm text-muted">{note.body}</p>
            </li>
          ))}
        </ul>
      </section>
      {updates.length === 0 ? <p className="text-sm text-muted">No weekly updates yet.</p> : null}
      <ul className="space-y-3">
        {updates.map((update) => (
          <li key={update.id} className="rounded-3xl border border-line bg-card p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold">Week ending {formatDate(update.date)}</p>
              <span className="text-sm text-muted">{update.stage}</span>
            </div>
            <p className="mt-1 text-sm">{update.note}</p>
            {update.blockers ? <p className="mt-1 text-sm text-out">Slowed by: {update.blockers}</p> : null}
            {update.photoIds.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {update.photoIds.map((photoId) => (
                  <Thumb key={photoId} id={photoId} alt={`${update.stage} photo`} />
                ))}
              </div>
            ) : null}
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                className="min-h-11 px-2 text-sm font-semibold text-due"
                onClick={() =>
                  onDelete('Delete this update?', 'The note and photos will be removed from this phone.', () => {
                    store.deleteProgress(update.id)
                    notify('Update deleted')
                  })
                }
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function EntrySheet({ sheet, site, onClose }: { sheet: SheetState; site: Site; onClose: () => void }) {
  const store = useStore()
  const title = sheetTitle(sheet)
  return (
    <Sheet open={Boolean(sheet)} title={title} onClose={onClose}>
      {sheet?.kind === 'owner' ? <OwnerPaymentForm siteId={site.id} onDone={onClose} /> : null}
      {sheet?.kind === 'owner-edit' ? (
        <OwnerPaymentForm existing={store.state.ownerPayments.find((item) => item.id === sheet.id)} onDone={onClose} />
      ) : null}
      {sheet?.kind === 'bill' ? <MaterialBillForm siteId={site.id} onDone={onClose} /> : null}
      {sheet?.kind === 'bill-edit' ? (
        <MaterialBillForm existing={store.state.materialBills.find((item) => item.id === sheet.id)} onDone={onClose} />
      ) : null}
      {sheet?.kind === 'bill-pay' ? <BillPay billId={sheet.id} onDone={onClose} /> : null}
      {sheet?.kind === 'contract' ? <LabourContractForm siteId={site.id} onDone={onClose} /> : null}
      {sheet?.kind === 'contract-edit' ? (
        <LabourContractForm existing={store.state.labourContracts.find((item) => item.id === sheet.id)} onDone={onClose} />
      ) : null}
      {sheet?.kind === 'kharchi' ? <KharchiForm siteId={site.id} contractId={sheet.contractId} onDone={onClose} /> : null}
      {sheet?.kind === 'kharchi-edit' ? (
        <KharchiForm existing={store.state.kharchi.find((item) => item.id === sheet.id)} onDone={onClose} />
      ) : null}
      {sheet?.kind === 'payout' ? <ContractPay contractId={sheet.contractId} onDone={onClose} /> : null}
      {sheet?.kind === 'progress' ? <ProgressForm siteId={site.id} onDone={onClose} /> : null}
      {sheet?.kind === 'request' ? <RequestForm siteId={site.id} onDone={onClose} /> : null}
      {sheet?.kind === 'request-edit' ? (
        <RequestForm siteId={site.id} existing={store.state.materialRequests.find((item) => item.id === sheet.id)} onDone={onClose} />
      ) : null}
    </Sheet>
  )
}

function BillPay({ billId, onDone }: { billId: string; onDone: () => void }) {
  const { state } = useStore()
  const bill = state.materialBills.find((item) => item.id === billId)
  if (!bill) return <p className="text-sm">That bill is no longer here.</p>
  return <VendorPayForm vendorId={bill.vendorId} billId={bill.id} onDone={onDone} />
}

function ContractPay({ contractId, onDone }: { contractId: string; onDone: () => void }) {
  const { state } = useStore()
  const contract = state.labourContracts.find((item) => item.id === contractId)
  if (!contract) return <p className="text-sm">That contract is no longer here.</p>
  return <VendorPayForm vendorId={contract.vendorId} contractId={contract.id} onDone={onDone} />
}

function sheetTitle(sheet: SheetState): string {
  switch (sheet?.kind) {
    case 'owner':
      return 'Log owner payment'
    case 'owner-edit':
      return 'Edit owner payment'
    case 'bill':
      return 'Log material bill'
    case 'bill-edit':
      return 'Edit material bill'
    case 'bill-pay':
      return 'Record payment'
    case 'contract':
      return 'Add lump-sum contract'
    case 'contract-edit':
      return 'Edit contract'
    case 'kharchi':
      return 'Log weekly kharchi'
    case 'kharchi-edit':
      return 'Edit kharchi'
    case 'payout':
      return 'Record labour payout'
    case 'progress':
      return 'Log this week'
    case 'request':
      return 'New material list'
    case 'request-edit':
      return 'Edit material list'
    default:
      return 'Log an entry'
  }
}

function Row({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className={strong ? 'font-semibold' : ''}>{label}</dt>
      <dd className={strong ? 'font-semibold tabular-nums' : 'tabular-nums'}>{formatINR(value)}</dd>
    </div>
  )
}

function Mini({ label, value, outbound }: { label: string; value: number; outbound?: boolean }) {
  return (
    <div className="rounded-2xl bg-card p-3">
      <p className="text-xs font-semibold text-muted">{label}</p>
      <p className={outbound && value > 0 ? 'mt-1 text-sm font-semibold tabular-nums text-out' : 'mt-1 text-sm font-semibold tabular-nums'}>{formatINR(value)}</p>
    </div>
  )
}
