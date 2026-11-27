import { useState, type FormEvent } from 'react'
import { useStore } from '../../context/Store'
import { digitsOnly, isISODate, parseQuantity, toISODate } from '../../lib/format'
import { uid } from '../../lib/id'
import { notify } from '../../lib/notify'
import { MATERIAL_CATEGORIES, UNITS, type MaterialRequest } from '../../types'
import { Button, Field, inputClassName } from '../ui'
import { DateField } from './fields'

interface ItemDraft {
  id: string
  material: string
  quantity: string
  unit: string
  note: string
}

export function RequestForm({
  siteId,
  existing,
  onDone,
}: {
  siteId: string
  existing?: MaterialRequest
  onDone: () => void
}) {
  const store = useStore()
  const vendors = store.state.vendors.filter((vendor) => vendor.kind === 'material')
  const [vendorId, setVendorId] = useState(existing?.vendorId ?? '')
  const [whatsapp, setWhatsapp] = useState(existing?.whatsapp ?? '')
  const [date, setDate] = useState(existing?.date ?? toISODate(new Date()))
  const [note, setNote] = useState(existing?.note ?? '')
  const [items, setItems] = useState<ItemDraft[]>(existing ? existing.items.map(toDraft) : [blankItem()])
  const [errors, setErrors] = useState<Record<string, string>>({})

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const nextErrors: Record<string, string> = {}
    const phone = digitsOnly(whatsapp)
    if (phone.length !== 10) nextErrors.whatsapp = 'Enter a 10-digit WhatsApp number.'
    if (!isISODate(date)) nextErrors.date = 'Choose a valid date.'
    if (items.length === 0) nextErrors.items = 'Add at least one material.'
    items.forEach((item, index) => {
      if (!item.material.trim()) nextErrors[`material-${index}`] = 'Name the material.'
      if (parseQuantity(item.quantity) == null) nextErrors[`qty-${index}`] = 'Enter a quantity above 0.'
    })
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    store.saveRequest({
      id: existing?.id ?? uid(),
      siteId,
      vendorId: vendorId || null,
      whatsapp: phone,
      date,
      note: note.trim(),
      items: items.map((item) => ({
        id: item.id,
        material: item.material.trim(),
        quantity: parseQuantity(item.quantity) ?? 0,
        unit: item.unit,
        note: item.note.trim(),
      })),
      createdAt: existing?.createdAt ?? toISODate(new Date()),
      lastSentAt: existing?.lastSentAt ?? null,
    })
    notify(existing ? 'Material list updated' : 'Material list saved')
    onDone()
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <Field label="Supplier" hint="Their saved number fills the WhatsApp field. You can change it.">
        <select
          className={inputClassName()}
          value={vendorId}
          onChange={(event) => {
            const nextId = event.target.value
            setVendorId(nextId)
            const vendor = vendors.find((item) => item.id === nextId)
            if (vendor?.phone) setWhatsapp(vendor.phone)
          }}
        >
          <option value="">No saved supplier</option>
          {vendors.map((vendor) => (
            <option key={vendor.id} value={vendor.id}>
              {vendor.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="WhatsApp number" error={errors.whatsapp}>
        <input
          className={inputClassName(Boolean(errors.whatsapp))}
          inputMode="numeric"
          value={whatsapp}
          onChange={(event) => setWhatsapp(event.target.value)}
        />
      </Field>
      <DateField label="Needed by" value={date} onChange={setDate} error={errors.date} />
      {errors.items ? <p className="text-sm font-medium text-due">{errors.items}</p> : null}
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={item.id} className="rounded-2xl border border-line p-3">
            <Field label={`Material ${index + 1}`} error={errors[`material-${index}`]}>
              <input
                className={inputClassName(Boolean(errors[`material-${index}`]))}
                list="material-names"
                value={item.material}
                onChange={(event) => patchItem(index, { material: event.target.value })}
              />
            </Field>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Field label="Quantity" error={errors[`qty-${index}`]}>
                <input
                  className={inputClassName(Boolean(errors[`qty-${index}`]))}
                  inputMode="decimal"
                  value={item.quantity}
                  onChange={(event) => patchItem(index, { quantity: event.target.value })}
                />
              </Field>
              <Field label="Unit">
                <select className={inputClassName()} value={item.unit} onChange={(event) => patchItem(index, { unit: event.target.value })}>
                  {UNITS.map((unit) => (
                    <option key={unit}>{unit}</option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="mt-2">
              <Field label="Note" hint="Optional. Grade, size, or brand.">
                <input className={inputClassName()} value={item.note} onChange={(event) => patchItem(index, { note: event.target.value })} />
              </Field>
            </div>
            {items.length > 1 ? (
              <Button variant="danger" className="mt-2" onClick={() => setItems((current) => current.filter((row) => row.id !== item.id))}>
                Remove
              </Button>
            ) : null}
          </div>
        ))}
      </div>
      <datalist id="material-names">
        {MATERIAL_CATEGORIES.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
      <Button variant="secondary" block onClick={() => setItems((current) => [...current, blankItem()])}>
        Add material
      </Button>
      <Field label="Message note" hint="Optional. Added at the end of the WhatsApp text.">
        <textarea className={inputClassName()} rows={2} value={note} onChange={(event) => setNote(event.target.value)} />
      </Field>
      <Button type="submit" block>
        Save list
      </Button>
    </form>
  )

  function patchItem(index: number, patch: Partial<ItemDraft>) {
    setItems((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)))
  }
}

function blankItem(): ItemDraft {
  return { id: uid(), material: '', quantity: '', unit: 'bags', note: '' }
}

function toDraft(item: MaterialRequest['items'][number]): ItemDraft {
  return { id: item.id, material: item.material, quantity: String(item.quantity), unit: item.unit, note: item.note }
}
