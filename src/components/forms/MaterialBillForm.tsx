import { useState, type FormEvent } from 'react'
import { billSettled, vendorAdvance } from '../../lib/calc'
import { useStore } from '../../context/Store'
import { addDays, formatINR, isISODate, parseAmount, parseQuantity, toISODate } from '../../lib/format'
import { uid } from '../../lib/id'
import { notify } from '../../lib/notify'
import { MATERIAL_CATEGORIES, UNITS, type MaterialBill } from '../../types'
import { PhotoPicker } from '../PhotoPicker'
import { Button, Field, inputClassName } from '../ui'
import { AmountField, DateField, emptyVendorChoice, SiteSelect, TextField, VendorSelect, type VendorChoice } from './fields'

export function MaterialBillForm({
  siteId,
  existing,
  onDone,
}: {
  siteId?: string
  existing?: MaterialBill
  onDone: () => void
}) {
  const store = useStore()
  const [site, setSite] = useState(existing?.siteId ?? siteId ?? '')
  const [choice, setChoice] = useState<VendorChoice>(emptyVendorChoice(existing?.vendorId ?? ''))
  const [date, setDate] = useState(existing?.date ?? toISODate(new Date()))
  const [category, setCategory] = useState(existing?.category ?? 'Cement')
  const [quantity, setQuantity] = useState(existing ? String(existing.quantity) : '')
  const [unit, setUnit] = useState(existing?.unit ?? 'bags')
  const [total, setTotal] = useState(existing ? String(existing.totalAmount) : '')
  const [paid, setPaid] = useState(existing ? String(existing.paidNow) : '')
  const [advance, setAdvance] = useState(existing ? String(existing.advanceAdjusted) : '0')
  const [due, setDue] = useState(existing?.creditDueDate ?? '')
  const [creditDays, setCreditDays] = useState<number | null>(null)
  const [note, setNote] = useState(existing?.note ?? '')
  const [keptPhoto, setKeptPhoto] = useState<string | null>(existing?.photoId ?? null)
  const [files, setFiles] = useState<File[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const vendorId = choice.mode === 'existing' ? choice.vendorId : ''
  const available = vendorId ? Math.max(0, vendorAdvance(store.state, vendorId, existing?.id)) : 0
  const settled = existing ? billSettled(store.state, existing.id) : 0
  const totalValue = parseAmount(total)
  const paidValue = parseAmount(paid || '0')
  const advanceValue = parseAmount(advance || '0')
  const pendingPreview =
    totalValue == null || paidValue == null || advanceValue == null
      ? null
      : totalValue - paidValue - advanceValue - settled

  function chooseCredit(days: number) {
    setCreditDays(days)
    if (days === 0) {
      setDue('')
      return
    }
    if (isISODate(date)) setDue(addDays(date, days))
  }

  function changeDate(next: string) {
    setDate(next)
    if (creditDays && creditDays > 0 && isISODate(next)) setDue(addDays(next, creditDays))
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const nextErrors: Record<string, string> = {}
    const billTotal = parseAmount(total)
    const paidNow = parseAmount(paid || '0')
    const advanceAdjusted = parseAmount(advance || '0')
    const qty = parseQuantity(quantity)
    if (!site) nextErrors.site = 'Choose a site.'
    if (choice.mode === 'existing' && !choice.vendorId) nextErrors.vendor = 'Choose a supplier.'
    if (choice.mode === 'new' && !choice.name.trim()) nextErrors.vendor = 'Enter the supplier name.'
    if (!category) nextErrors.category = 'Choose a material.'
    if (qty == null) nextErrors.quantity = 'Enter a quantity above 0.'
    if (billTotal == null || billTotal <= 0) nextErrors.total = 'Enter the bill amount.'
    if (paidNow == null || paidNow < 0) nextErrors.paid = 'Enter 0 if nothing was paid now.'
    if (advanceAdjusted == null || advanceAdjusted < 0) nextErrors.advance = 'Enter 0 if no advance is adjusted.'
    if (
      billTotal != null &&
      paidNow != null &&
      advanceAdjusted != null &&
      paidNow + advanceAdjusted + settled > billTotal
    ) {
      nextErrors.total =
        settled > 0
          ? `Payments already recorded are ${formatINR(settled)}. The bill has to cover those, plus paid now and any advance.`
          : 'Paid now and advance adjusted are more than the bill. Reduce one of them.'
    }
    if (advanceAdjusted != null && advanceAdjusted > available) {
      nextErrors.advance =
        available > 0
          ? `Only ${formatINR(available)} advance is left with this supplier.`
          : 'This supplier has no advance left to adjust.'
    }
    if (due && !isISODate(due)) nextErrors.due = 'Choose a valid due date.'
    if (!isISODate(date)) nextErrors.date = 'Choose a valid date.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    setSaving(true)
    setFormError('')
    try {
      let photoId = keptPhoto
      if (files[0]) photoId = await store.attachPhoto(files[0])
      store.saveMaterialBill(
        {
          id: existing?.id ?? uid(),
          siteId: site,
          vendorId: choice.vendorId,
          date,
          category,
          quantity: qty ?? 0,
          unit,
          totalAmount: billTotal ?? 0,
          paidNow: paidNow ?? 0,
          advanceAdjusted: advanceAdjusted ?? 0,
          creditDueDate: due || null,
          note: note.trim(),
          photoId,
        },
        choice.mode === 'new'
          ? { name: choice.name, phone: choice.phone, kind: 'material', trade: category }
          : undefined,
      )
      notify(existing ? 'Material bill updated' : 'Material bill saved')
      onDone()
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Could not save this bill.')
      setSaving(false)
    }
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <SiteSelect value={site} onChange={setSite} error={errors.site} />
      <VendorSelect kind="material" noun="Supplier" value={choice} onChange={setChoice} />
      {errors.vendor ? <p className="-mt-2 text-sm font-medium text-due">{errors.vendor}</p> : null}
      <div className="grid grid-cols-2 gap-3">
        <DateField label="Bill date" value={date} onChange={changeDate} error={errors.date} />
        <Field label="Material" error={errors.category}>
          <select className={inputClassName(Boolean(errors.category))} value={category} onChange={(event) => setCategory(event.target.value)}>
            {MATERIAL_CATEGORIES.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <TextField label="Quantity" value={quantity} onChange={setQuantity} error={errors.quantity} />
        <Field label="Unit">
          <select className={inputClassName()} value={unit} onChange={(event) => setUnit(event.target.value)}>
            {UNITS.map((item) => (
              <option key={item}>{item}</option>
            ))}
            {existing && !(UNITS as readonly string[]).includes(existing.unit) ? <option>{existing.unit}</option> : null}
          </select>
        </Field>
      </div>
      <AmountField label="Bill amount" value={total} onChange={setTotal} error={errors.total} />
      <AmountField label="Paid now" value={paid} onChange={setPaid} error={errors.paid} hint="Cash or UPI paid at delivery. Use 0 on full credit." />
      <AmountField
        label="Advance adjusted"
        value={advance}
        onChange={setAdvance}
        error={errors.advance}
        hint={vendorId ? `${formatINR(available)} advance is available.` : 'Choose a supplier to use an advance.'}
      />
      {pendingPreview != null ? (
        <p className="rounded-2xl bg-paper px-3 py-3 text-sm">
          Pending on this bill{' '}
          <strong className={pendingPreview > 0 ? 'text-out' : 'text-cash'}>{formatINR(Math.max(0, pendingPreview))}</strong>
        </p>
      ) : null}
      <div>
        <p className="mb-2 text-sm font-semibold">Credit</p>
        <div className="grid grid-cols-4 gap-2">
          {[
            [0, 'COD'],
            [7, '7 days'],
            [15, '15 days'],
            [30, '30 days'],
          ].map(([days, label]) => (
            <button
              key={label}
              type="button"
              onClick={() => chooseCredit(Number(days))}
              className="min-h-11 rounded-xl border border-line bg-paper text-sm font-semibold"
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <DateField label="Credit due date" value={due} onChange={(next) => { setCreditDays(null); setDue(next) }} error={errors.due} />
      {pendingPreview != null && pendingPreview > 0 && !due ? (
        <p className="text-sm text-wait">Add a due date so this bill shows in the 7-day credit alert.</p>
      ) : null}
      <TextField label="Note" value={note} onChange={setNote} hint="Optional. Example: UltraTech PPC for columns." />
      <PhotoPicker
        label="Challan or bill photo"
        existingIds={keptPhoto ? [keptPhoto] : []}
        onRemoveExisting={() => setKeptPhoto(null)}
        files={files}
        onFiles={(next) => {
          setFiles(next)
          if (next.length > 0) setKeptPhoto(null)
        }}
      />
      {formError ? <p className="text-sm font-medium text-due">{formError}</p> : null}
      <Button type="submit" block disabled={saving}>
        {saving ? 'Saving…' : 'Save bill'}
      </Button>
    </form>
  )
}
