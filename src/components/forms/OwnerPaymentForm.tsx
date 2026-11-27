import { useState, type FormEvent } from 'react'
import { useStore } from '../../context/Store'
import { isISODate, parseAmount, toISODate } from '../../lib/format'
import { uid } from '../../lib/id'
import { notify } from '../../lib/notify'
import { PAYMENT_MODES, type OwnerPayment, type PaymentMode } from '../../types'
import { PhotoPicker } from '../PhotoPicker'
import { Button, Field, inputClassName } from '../ui'
import { AmountField, DateField, SiteSelect, TextField } from './fields'

export function OwnerPaymentForm({
  siteId,
  existing,
  onDone,
}: {
  siteId?: string
  existing?: OwnerPayment
  onDone: () => void
}) {
  const store = useStore()
  const [site, setSite] = useState(existing?.siteId ?? siteId ?? '')
  const [amount, setAmount] = useState(existing ? String(existing.amount) : '')
  const [date, setDate] = useState(existing?.date ?? toISODate(new Date()))
  const [mode, setMode] = useState<PaymentMode>(existing?.mode ?? 'UPI')
  const [reference, setReference] = useState(existing?.reference ?? '')
  const [note, setNote] = useState(existing?.note ?? '')
  const [keptPhoto, setKeptPhoto] = useState<string | null>(existing?.photoId ?? null)
  const [files, setFiles] = useState<File[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const nextErrors: Record<string, string> = {}
    const parsed = parseAmount(amount)
    if (!site) nextErrors.site = 'Choose a site.'
    if (parsed == null || parsed <= 0) nextErrors.amount = 'Enter an amount above ₹0.'
    if (!isISODate(date)) nextErrors.date = 'Choose a valid date.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    setSaving(true)
    setFormError('')
    try {
      let photoId = keptPhoto
      if (files[0]) photoId = await store.attachPhoto(files[0])
      store.saveOwnerPayment({
        id: existing?.id ?? uid(),
        siteId: site,
        date,
        amount: parsed ?? 0,
        mode,
        reference: reference.trim(),
        note: note.trim(),
        photoId,
      })
      notify(existing ? 'Owner payment updated' : 'Owner payment saved')
      onDone()
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Could not save this payment.')
      setSaving(false)
    }
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <SiteSelect value={site} onChange={setSite} error={errors.site} />
      <AmountField label="Amount received" value={amount} onChange={setAmount} error={errors.amount} />
      <DateField label="Date" value={date} onChange={setDate} error={errors.date} />
      <Field label="Payment mode">
        <select className={inputClassName()} value={mode} onChange={(event) => setMode(event.target.value as PaymentMode)}>
          {PAYMENT_MODES.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </Field>
      <TextField label="UPI or bank reference" value={reference} onChange={setReference} hint="UTR, cheque number, or UPI transaction id." />
      <TextField label="Note" value={note} onChange={setNote} hint="Optional. Example: ground slab stage." />
      <PhotoPicker
        label="UPI screenshot"
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
        {saving ? 'Saving…' : 'Save payment'}
      </Button>
    </form>
  )
}
