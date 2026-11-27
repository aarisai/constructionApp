import { useState, type FormEvent } from 'react'
import { useStore } from '../../context/Store'
import { contractKharchi, contractPayouts, contractRemaining, vendorName } from '../../lib/calc'
import { formatINR, isISODate, parseAmount, toISODate } from '../../lib/format'
import { uid } from '../../lib/id'
import { notify } from '../../lib/notify'
import { PAYMENT_MODES, type Kharchi, type LabourContract, type PaymentMode } from '../../types'
import { PhotoPicker } from '../PhotoPicker'
import { Button, Field, inputClassName, Segmented } from '../ui'
import { AmountField, DateField, emptyVendorChoice, SiteSelect, TextField, VendorSelect, type VendorChoice } from './fields'

export function LabourEntry({ siteId, onDone }: { siteId?: string; onDone: () => void }) {
  const [mode, setMode] = useState<'contract' | 'kharchi'>('kharchi')
  return (
    <div className="space-y-4">
      <Segmented
        label="Labour entry"
        value={mode}
        onChange={setMode}
        options={[
          { value: 'kharchi', label: 'Weekly kharchi' },
          { value: 'contract', label: 'Lump-sum contract' },
        ]}
      />
      {mode === 'kharchi' ? <KharchiForm siteId={siteId} onDone={onDone} /> : <LabourContractForm siteId={siteId} onDone={onDone} />}
    </div>
  )
}

export function LabourContractForm({
  siteId,
  existing,
  onDone,
}: {
  siteId?: string
  existing?: LabourContract
  onDone: () => void
}) {
  const store = useStore()
  const [site, setSite] = useState(existing?.siteId ?? siteId ?? '')
  const [choice, setChoice] = useState<VendorChoice>(emptyVendorChoice(existing?.vendorId ?? ''))
  const [trade, setTrade] = useState(existing?.trade ?? '')
  const [amount, setAmount] = useState(existing ? String(existing.lumpSum) : '')
  const [date, setDate] = useState(existing?.date ?? toISODate(new Date()))
  const [note, setNote] = useState(existing?.note ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const nextErrors: Record<string, string> = {}
    const lumpSum = parseAmount(amount)
    if (!site) nextErrors.site = 'Choose a site.'
    if (choice.mode === 'existing' && !choice.vendorId) nextErrors.vendor = 'Choose a mestri or labour vendor.'
    if (choice.mode === 'new' && !choice.name.trim()) nextErrors.vendor = 'Enter the mestri or vendor name.'
    if (!trade.trim()) nextErrors.trade = 'Enter the trade. Example: structure, centring, plastering.'
    if (lumpSum == null || lumpSum <= 0) nextErrors.amount = 'Enter the lump-sum contract amount.'
    if (existing) {
      const paid = contractKharchi(store.state, existing.id) + contractPayouts(store.state, existing.id)
      if (lumpSum != null && lumpSum < paid) {
        nextErrors.amount = `Kharchi and payouts already total ${formatINR(paid)}. The contract has to cover that.`
      }
    }
    if (!isISODate(date)) nextErrors.date = 'Choose a valid date.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    store.saveLabourContract(
      {
        id: existing?.id ?? uid(),
        siteId: site,
        vendorId: choice.vendorId,
        trade: trade.trim(),
        lumpSum: lumpSum ?? 0,
        date,
        note: note.trim(),
      },
      choice.mode === 'new'
        ? { name: choice.name, phone: choice.phone, kind: 'labour', trade: trade.trim() }
        : undefined,
    )
    notify(existing ? 'Contract updated' : 'Contract saved')
    onDone()
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <SiteSelect value={site} onChange={setSite} error={errors.site} />
      <VendorSelect kind="labour" noun="Mestri" value={choice} onChange={setChoice} />
      {errors.vendor ? <p className="-mt-2 text-sm font-medium text-due">{errors.vendor}</p> : null}
      <TextField label="Trade" value={trade} onChange={setTrade} error={errors.trade} hint="Example: structure through brickwork, or plastering." />
      <AmountField label="Lump-sum amount" value={amount} onChange={setAmount} error={errors.amount} />
      <DateField label="Contract date" value={date} onChange={setDate} error={errors.date} />
      <TextField label="Note" value={note} onChange={setNote} hint="Optional." />
      <Button type="submit" block>
        Save contract
      </Button>
    </form>
  )
}

export function KharchiForm({
  siteId,
  contractId,
  existing,
  onDone,
}: {
  siteId?: string
  contractId?: string
  existing?: Kharchi
  onDone: () => void
}) {
  const store = useStore()
  const contracts = store.state.labourContracts.filter((contract) => !siteId || contract.siteId === siteId || contract.id === existing?.contractId)
  const [selected, setSelected] = useState(existing?.contractId ?? contractId ?? (contracts.length === 1 ? contracts[0].id : ''))
  const [amount, setAmount] = useState(existing ? String(existing.amount) : '')
  const [date, setDate] = useState(existing?.date ?? toISODate(new Date()))
  const [mode, setMode] = useState<PaymentMode>(existing?.mode ?? 'Cash')
  const [reference, setReference] = useState(existing?.reference ?? '')
  const [note, setNote] = useState(existing?.note ?? 'Saturday kharchi')
  const [keptPhoto, setKeptPhoto] = useState<string | null>(existing?.photoId ?? null)
  const [files, setFiles] = useState<File[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const contract = store.state.labourContracts.find((item) => item.id === selected)
  const cap = contract ? contractRemaining(store.state, contract) + (existing && existing.contractId === contract.id ? existing.amount : 0) : 0

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const nextErrors: Record<string, string> = {}
    const parsed = parseAmount(amount)
    if (!contract) nextErrors.contract = 'Choose a lump-sum contract.'
    if (parsed == null || parsed <= 0) nextErrors.amount = 'Enter the kharchi amount.'
    if (contract && parsed != null && parsed > cap) {
      nextErrors.amount = `Only ${formatINR(cap)} is left on this contract.`
    }
    if (!isISODate(date)) nextErrors.date = 'Choose a valid date.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0 || !contract) return
    setSaving(true)
    setFormError('')
    try {
      let photoId = keptPhoto
      if (files[0]) photoId = await store.attachPhoto(files[0])
      store.saveKharchi({
        id: existing?.id ?? uid(),
        siteId: contract.siteId,
        contractId: contract.id,
        vendorId: contract.vendorId,
        date,
        amount: parsed ?? 0,
        mode,
        reference: reference.trim(),
        note: note.trim(),
        photoId,
      })
      notify('Kharchi saved')
      onDone()
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Could not save this kharchi.')
      setSaving(false)
    }
  }

  if (contracts.length === 0) {
    return <p className="text-sm text-muted">Add a lump-sum contract first. Kharchi is deducted from it.</p>
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <p className="text-sm text-muted">Weekly advance for the mestri. It is deducted from the lump-sum contract.</p>
      {contractId && contract ? (
        <p className="rounded-2xl bg-paper px-3 py-3 text-sm font-semibold">
          {vendorName(store.state, contract.vendorId)} · {formatINR(cap)} left
        </p>
      ) : (
        <Field label="Contract" error={errors.contract}>
          <select className={inputClassName(Boolean(errors.contract))} value={selected} onChange={(event) => setSelected(event.target.value)}>
            <option value="">Choose a contract</option>
            {contracts.map((item) => (
              <option key={item.id} value={item.id}>
                {vendorName(store.state, item.vendorId)} · {item.trade} · {formatINR(contractRemaining(store.state, item))} left
              </option>
            ))}
          </select>
        </Field>
      )}
      <AmountField label="Kharchi amount" value={amount} onChange={setAmount} error={errors.amount} hint={contract ? `${formatINR(cap)} left on this contract.` : undefined} />
      <DateField label="Date" value={date} onChange={setDate} error={errors.date} />
      <Field label="Payment mode">
        <select className={inputClassName()} value={mode} onChange={(event) => setMode(event.target.value as PaymentMode)}>
          {PAYMENT_MODES.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </Field>
      <TextField label="UPI reference" value={reference} onChange={setReference} hint="Optional for cash." />
      <TextField label="Note" value={note} onChange={setNote} />
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
        {saving ? 'Saving…' : 'Save kharchi'}
      </Button>
    </form>
  )
}
