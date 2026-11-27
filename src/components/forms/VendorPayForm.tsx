import { useState, type FormEvent } from 'react'
import { useStore } from '../../context/Store'
import { billPending, contractRemaining, openBills, openContracts, siteName, vendorName } from '../../lib/calc'
import { formatDate, formatINR, isISODate, parseAmount, toISODate } from '../../lib/format'
import { uid } from '../../lib/id'
import { notify } from '../../lib/notify'
import { PAYMENT_MODES, type PaymentKind, type PaymentMode } from '../../types'
import { PhotoPicker } from '../PhotoPicker'
import { Button, Field, inputClassName, Segmented } from '../ui'
import { AmountField, DateField, TextField } from './fields'

export function VendorPayForm({
  vendorId,
  billId,
  contractId,
  onDone,
}: {
  vendorId: string
  billId?: string
  contractId?: string
  onDone: () => void
}) {
  const store = useStore()
  const bills = openBills(store.state, vendorId)
  const contracts = openContracts(store.state, vendorId)
  const locked: PaymentKind | null = billId ? 'bill' : contractId ? 'labour' : null
  const initialKind: PaymentKind = locked ?? (bills.length > 0 ? 'bill' : contracts.length > 0 ? 'labour' : 'advance')
  const presetBill = billId ? store.state.materialBills.find((bill) => bill.id === billId) : undefined
  const presetContract = contractId ? store.state.labourContracts.find((contract) => contract.id === contractId) : undefined
  const [kind, setKind] = useState<PaymentKind>(initialKind)
  const [selectedBill, setSelectedBill] = useState(presetBill?.id ?? bills[0]?.bill.id ?? '')
  const [selectedContract, setSelectedContract] = useState(presetContract?.id ?? contracts[0]?.contract.id ?? '')
  const [siteId, setSiteId] = useState(presetBill?.siteId ?? presetContract?.siteId ?? store.state.sites[0]?.id ?? '')
  const [amount, setAmount] = useState(() => {
    if (presetBill) return String(billPending(store.state, presetBill))
    if (presetContract) return String(contractRemaining(store.state, presetContract))
    return ''
  })
  const [date, setDate] = useState(toISODate(new Date()))
  const [mode, setMode] = useState<PaymentMode>('UPI')
  const [reference, setReference] = useState('')
  const [note, setNote] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const bill = store.state.materialBills.find((item) => item.id === selectedBill)
  const contract = store.state.labourContracts.find((item) => item.id === selectedContract)
  const cap =
    kind === 'bill' && bill ? billPending(store.state, bill) : kind === 'labour' && contract ? contractRemaining(store.state, contract) : null

  function chooseBill(id: string) {
    setSelectedBill(id)
    const next = store.state.materialBills.find((item) => item.id === id)
    if (next) setAmount(String(billPending(store.state, next)))
  }

  function chooseContract(id: string) {
    setSelectedContract(id)
    const next = store.state.labourContracts.find((item) => item.id === id)
    if (next) setAmount(String(contractRemaining(store.state, next)))
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const nextErrors: Record<string, string> = {}
    const parsed = parseAmount(amount)
    if (parsed == null || parsed <= 0) nextErrors.amount = 'Enter an amount above ₹0.'
    if (!isISODate(date)) nextErrors.date = 'Choose a valid date.'
    if (kind === 'bill' && !bill) nextErrors.target = 'Choose an open bill.'
    if (kind === 'labour' && !contract) nextErrors.target = 'Choose a contract with balance left.'
    if (kind === 'advance' && !siteId) nextErrors.site = 'Choose the site this advance is for.'
    if (parsed != null && cap != null && parsed > cap) nextErrors.amount = `Only ${formatINR(cap)} is still open.`
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    setSaving(true)
    setFormError('')
    try {
      const photoId = files[0] ? await store.attachPhoto(files[0]) : null
      store.saveVendorPayment({
        id: uid(),
        vendorId,
        siteId: kind === 'bill' ? (bill?.siteId ?? null) : kind === 'labour' ? (contract?.siteId ?? null) : siteId,
        billId: kind === 'bill' ? (bill?.id ?? null) : null,
        contractId: kind === 'labour' ? (contract?.id ?? null) : null,
        date,
        amount: parsed ?? 0,
        mode,
        kind,
        reference: reference.trim(),
        note: note.trim(),
        photoId,
      })
      notify('Payment recorded')
      onDone()
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Could not save this payment.')
      setSaving(false)
    }
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <p className="text-sm text-muted">Paying {vendorName(store.state, vendorId)}.</p>
      {locked ? null : (
        <Segmented
          label="Payment type"
          value={kind}
          onChange={setKind}
          options={[
            { value: 'bill', label: 'Settle bill' },
            { value: 'labour', label: 'Labour payout' },
            { value: 'advance', label: 'Advance' },
          ]}
        />
      )}
      {kind === 'bill' ? (
        billId && bill ? (
          <p className="rounded-2xl bg-paper px-3 py-3 text-sm">
            {siteName(store.state, bill.siteId)} · {bill.category} · {formatINR(billPending(store.state, bill))} pending
            {bill.creditDueDate ? ` · due ${formatDate(bill.creditDueDate)}` : ''}
          </p>
        ) : (
          <Field label="Open bill" error={errors.target}>
            <select className={inputClassName(Boolean(errors.target))} value={selectedBill} onChange={(event) => chooseBill(event.target.value)}>
              <option value="">Choose a bill</option>
              {bills.map((item) => (
                <option key={item.bill.id} value={item.bill.id}>
                  {siteName(store.state, item.bill.siteId)} · {item.bill.category} · {formatINR(item.pending)}
                </option>
              ))}
            </select>
          </Field>
        )
      ) : null}
      {kind === 'labour' ? (
        contractId && contract ? (
          <p className="rounded-2xl bg-paper px-3 py-3 text-sm">
            {contract.trade} · {formatINR(contractRemaining(store.state, contract))} left
          </p>
        ) : (
          <Field label="Contract" error={errors.target}>
            <select
              className={inputClassName(Boolean(errors.target))}
              value={selectedContract}
              onChange={(event) => chooseContract(event.target.value)}
            >
              <option value="">Choose a contract</option>
              {contracts.map((item) => (
                <option key={item.contract.id} value={item.contract.id}>
                  {siteName(store.state, item.contract.siteId)} · {item.contract.trade} · {formatINR(item.remaining)} left
                </option>
              ))}
            </select>
          </Field>
        )
      ) : null}
      {kind === 'advance' ? (
        <Field label="Site" error={errors.site} hint="This sits as credit with the supplier until you adjust it on a bill.">
          <select className={inputClassName(Boolean(errors.site))} value={siteId} onChange={(event) => setSiteId(event.target.value)}>
            <option value="">Choose a site</option>
            {store.state.sites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.name}
              </option>
            ))}
          </select>
        </Field>
      ) : null}
      {bills.length === 0 && kind === 'bill' ? <p className="text-sm text-muted">No open bills for this vendor.</p> : null}
      {contracts.length === 0 && kind === 'labour' ? <p className="text-sm text-muted">No labour balance left for this mestri.</p> : null}
      <AmountField label="Amount" value={amount} onChange={setAmount} error={errors.amount} hint={cap != null ? `${formatINR(cap)} still open.` : undefined} />
      <DateField label="Date" value={date} onChange={setDate} error={errors.date} />
      <Field label="Payment mode">
        <select className={inputClassName()} value={mode} onChange={(event) => setMode(event.target.value as PaymentMode)}>
          {PAYMENT_MODES.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </Field>
      <TextField label="UPI or bank reference" value={reference} onChange={setReference} hint="Optional for cash." />
      <TextField label="Note" value={note} onChange={setNote} hint="Optional." />
      <PhotoPicker label="UPI screenshot" existingIds={[]} onRemoveExisting={() => undefined} files={files} onFiles={setFiles} />
      {formError ? <p className="text-sm font-medium text-due">{formError}</p> : null}
      <Button type="submit" block disabled={saving}>
        {saving ? 'Saving…' : 'Save payment'}
      </Button>
    </form>
  )
}
