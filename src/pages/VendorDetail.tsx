import { useState, type FormEvent } from 'react'
import { useStore } from '../context/Store'
import { VendorPayForm } from '../components/forms/VendorPayForm'
import { Thumb } from '../components/PhotoPicker'
import { Badge, Button, ConfirmDialog, Field, inputClassName, NotFound, PageHeader, Sheet } from '../components/ui'
import { billPending, contractRemaining, vendorSummaries } from '../lib/calc'
import { daysFromToday, digitsOnly, dueLabel, formatDate, formatINR, formatPhone, formatQty } from '../lib/format'
import { notify } from '../lib/notify'
import { toHash } from '../lib/routes'

export function VendorDetail({ id }: { id: string }) {
  const store = useStore()
  const vendor = store.state.vendors.find((item) => item.id === id)
  const [paying, setPaying] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [name, setName] = useState(vendor?.name ?? '')
  const [phone, setPhone] = useState(vendor?.phone ?? '')
  const [trade, setTrade] = useState(vendor?.trade ?? '')
  const [notes, setNotes] = useState(vendor?.notes ?? '')
  if (!vendor) return <NotFound title="Vendor not found" body="This vendor is not on this phone." href="#/vendors" action="Back to vendors" />
  const current = vendor
  const summary = vendorSummaries(store.state).find((item) => item.vendorId === current.id)
  const bills = store.state.materialBills.filter((bill) => bill.vendorId === vendor.id)
  const contracts = store.state.labourContracts.filter((contract) => contract.vendorId === vendor.id)
  const payments = store.state.vendorPayments
    .filter((payment) => payment.vendorId === vendor.id)
    .sort((a, b) => b.date.localeCompare(a.date))
  const due = summary?.nextDays == null ? null : dueLabel(summary.nextDays)

  function saveDetails(event: FormEvent) {
    event.preventDefault()
    if (!name.trim()) return
    store.saveVendor({ ...current, name: name.trim(), phone: digitsOnly(phone), trade: trade.trim(), notes: notes.trim() })
    notify('Vendor updated')
  }

  return (
    <div className="space-y-4">
      <PageHeader title={vendor.name} subtitle={vendor.kind === 'material' ? 'Material supplier' : 'Labour / mestri'} back="#/vendors" />
      <div className="flex flex-wrap gap-2">
        <Badge tone="brand">{vendor.kind === 'material' ? 'Material' : 'Labour'}</Badge>
        {summary && summary.pending > 0 ? <Badge tone={summary.overdue ? 'due' : 'wait'}>{summary.overdue ? 'Overdue' : 'Credit active'}</Badge> : <Badge tone="cash">Clear</Badge>}
        {due?.text ? <Badge tone={due.tone === 'neutral' ? 'neutral' : due.tone}>{due.text}</Badge> : null}
      </div>
      {vendor.phone ? (
        <a className="inline-flex min-h-12 items-center font-semibold" href={`tel:${vendor.phone}`}>
          {formatPhone(vendor.phone)}
        </a>
      ) : null}
      <section className="grid grid-cols-2 gap-3">
        <article className="rounded-3xl bg-card p-4">
          <p className="text-sm text-muted">Pending</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-out">{formatINR(summary?.pending ?? 0)}</p>
        </article>
        <article className="rounded-3xl bg-wait-soft p-4">
          <p className="text-sm text-wait">Advance balance</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-wait">{formatINR(Math.max(0, summary?.advance ?? 0))}</p>
        </article>
      </section>
      <Button block onClick={() => setPaying(true)}>
        Record payment
      </Button>
      <section className="space-y-3">
        <h2 className="font-semibold">By site</h2>
        {(summary?.sites.length ?? 0) === 0 ? <p className="text-sm text-muted">No bills or contracts yet.</p> : null}
        {summary?.sites.map((site) => (
          <a key={site.siteId} href={toHash({ name: 'site', id: site.siteId, tab: vendor.kind === 'material' ? 'material' : 'labour' })} className="block rounded-2xl border border-line bg-card px-3 py-3">
            <span className="font-semibold">{site.siteName}</span>
            <span className="mt-1 block text-sm text-muted">Pending {formatINR(site.pending)}</span>
          </a>
        ))}
      </section>
      {bills.length > 0 ? (
        <section className="space-y-2">
          <h2 className="font-semibold">Material bills</h2>
          {bills
            .slice()
            .sort((a, b) => b.date.localeCompare(a.date))
            .map((bill) => {
              const pending = billPending(store.state, bill)
              const days = bill.creditDueDate ? daysFromToday(bill.creditDueDate) : null
              const label = days == null ? null : dueLabel(days)
              return (
                <article key={bill.id} className="rounded-2xl border border-line bg-card p-3">
                  <p className="font-semibold">{bill.category}</p>
                  <p className="text-sm text-muted">
                    {formatDate(bill.date)} · {formatQty(bill.quantity, bill.unit)} · bill {formatINR(bill.totalAmount)}
                  </p>
                  <p className={pending > 0 ? 'mt-1 text-sm font-semibold text-out' : 'mt-1 text-sm font-semibold text-cash'}>
                    {pending > 0 ? `${formatINR(pending)} pending` : 'Paid'}
                    {label?.text ? ` · ${label.text}` : bill.creditDueDate && pending > 0 ? ` · due ${formatDate(bill.creditDueDate)}` : ''}
                  </p>
                </article>
              )
            })}
        </section>
      ) : null}
      {contracts.length > 0 ? (
        <section className="space-y-2">
          <h2 className="font-semibold">Labour contracts</h2>
          {contracts.map((contract) => {
            const left = contractRemaining(store.state, contract)
            return (
              <article key={contract.id} className="rounded-2xl border border-line bg-card p-3">
                <p className="font-semibold">{contract.trade}</p>
                <p className="text-sm text-muted">
                  Lump sum {formatINR(contract.lumpSum)} · {formatINR(left)} left
                </p>
              </article>
            )
          })}
        </section>
      ) : null}
      {payments.length > 0 ? (
        <section className="space-y-2">
          <h2 className="font-semibold">Payments you recorded</h2>
          {payments.map((payment) => (
            <article key={payment.id} className="rounded-2xl border border-line bg-card p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{formatDate(payment.date)}</p>
                  <p className="text-sm text-muted">
                    {payment.kind === 'advance' ? 'Advance' : payment.kind === 'labour' ? 'Labour payout' : 'Bill settlement'} · {payment.mode}
                    {payment.reference ? ` · ${payment.reference}` : ''}
                  </p>
                </div>
                <p className="font-semibold tabular-nums">{formatINR(payment.amount)}</p>
              </div>
              {payment.photoId ? (
                <div className="mt-2">
                  <Thumb id={payment.photoId} alt="Payment screenshot" />
                </div>
              ) : null}
              <button
                type="button"
                className="mt-2 min-h-11 text-sm font-semibold text-due"
                onClick={() => {
                  store.deleteVendorPayment(payment.id)
                  notify('Payment removed')
                }}
              >
                Remove payment
              </button>
            </article>
          ))}
        </section>
      ) : null}
      <form className="space-y-3 rounded-3xl border border-line bg-card p-4" onSubmit={saveDetails}>
        <h2 className="font-semibold">Vendor details</h2>
        <Field label="Name">
          <input className={inputClassName()} value={name} onChange={(event) => setName(event.target.value)} />
        </Field>
        <Field label="Phone">
          <input className={inputClassName()} inputMode="numeric" value={phone} onChange={(event) => setPhone(event.target.value)} />
        </Field>
        <Field label="Trade">
          <input className={inputClassName()} value={trade} onChange={(event) => setTrade(event.target.value)} />
        </Field>
        <Field label="Notes">
          <textarea className={inputClassName()} rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} />
        </Field>
        <Button type="submit" block>
          Save vendor
        </Button>
        <Button variant="danger" block onClick={() => setConfirm(true)}>
          Delete vendor
        </Button>
      </form>
      <Sheet open={paying} title="Record payment" onClose={() => setPaying(false)}>
        {paying ? <VendorPayForm vendorId={vendor.id} onDone={() => setPaying(false)} /> : null}
      </Sheet>
      <ConfirmDialog
        open={confirm}
        title={`Delete ${vendor.name}?`}
        body="You can delete a vendor only when no bills, contracts, or payments point to them."
        confirmLabel="Delete vendor"
        danger
        onClose={() => setConfirm(false)}
        onConfirm={() => {
          const removed = store.deleteVendor(vendor.id)
          setConfirm(false)
          if (removed) {
            notify('Vendor deleted')
            window.location.hash = '#/vendors'
          }
        }}
      />
    </div>
  )
}
