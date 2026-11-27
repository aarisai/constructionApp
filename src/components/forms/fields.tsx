import { useStore } from '../../context/Store'
import type { VendorKind } from '../../types'
import { formatDate, formatINR, isISODate } from '../../lib/format'
import { Field, inputClassName } from '../ui'

export interface VendorChoice {
  mode: 'existing' | 'new'
  vendorId: string
  name: string
  phone: string
}

export function emptyVendorChoice(vendorId = ''): VendorChoice {
  return { mode: 'existing', vendorId, name: '', phone: '' }
}

export function SiteSelect({
  value,
  onChange,
  error,
}: {
  value: string
  onChange: (siteId: string) => void
  error?: string
}) {
  const { state } = useStore()
  return (
    <Field label="Site" error={error}>
      <select className={inputClassName(Boolean(error))} value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Choose a site</option>
        {state.sites.map((site) => (
          <option key={site.id} value={site.id}>
            {site.name}
            {site.active ? '' : ' (inactive)'}
          </option>
        ))}
      </select>
    </Field>
  )
}

export function VendorSelect({
  kind,
  value,
  onChange,
  noun,
}: {
  kind: VendorKind
  value: VendorChoice
  onChange: (value: VendorChoice) => void
  noun: string
}) {
  const { state } = useStore()
  const vendors = state.vendors.filter((vendor) => vendor.kind === kind)
  return (
    <div className="space-y-3">
      {value.mode === 'existing' ? (
        <Field label={noun} error={vendors.length === 0 ? `Add a ${noun.toLowerCase()} to continue.` : undefined}>
          <select
            className={inputClassName()}
            value={value.vendorId}
            onChange={(event) => onChange({ ...value, vendorId: event.target.value })}
          >
            <option value="">Choose {noun.toLowerCase()}</option>
            {vendors.map((vendor) => (
              <option key={vendor.id} value={vendor.id}>
                {vendor.name}
              </option>
            ))}
          </select>
        </Field>
      ) : (
        <div className="grid gap-3">
          <Field label={`${noun} name`}>
            <input
              className={inputClassName()}
              value={value.name}
              autoComplete="off"
              onChange={(event) => onChange({ ...value, name: event.target.value })}
            />
          </Field>
          <Field label="Phone" hint="Optional">
            <input
              className={inputClassName()}
              inputMode="numeric"
              autoComplete="off"
              value={value.phone}
              onChange={(event) => onChange({ ...value, phone: event.target.value })}
            />
          </Field>
        </div>
      )}
      <button
        type="button"
        className="min-h-11 text-left text-sm font-semibold underline-offset-2 hover:underline"
        onClick={() => onChange({ ...value, mode: value.mode === 'existing' ? 'new' : 'existing' })}
      >
        {value.mode === 'existing' ? `Add a new ${noun.toLowerCase()}` : `Choose an existing ${noun.toLowerCase()}`}
      </button>
    </div>
  )
}

export function AmountField({
  label,
  value,
  onChange,
  error,
  hint,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  hint?: string
}) {
  const parsed = value.trim() ? Number(value.replace(/[₹,\s]/g, '')) : null
  const shown = parsed != null && Number.isFinite(parsed) ? formatINR(parsed) : undefined
  return (
    <Field label={label} error={error} hint={error ? undefined : (hint ?? shown)}>
      <input
        className={inputClassName(Boolean(error))}
        inputMode="decimal"
        autoComplete="off"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  )
}

export function DateField({
  label,
  value,
  onChange,
  error,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
}) {
  return (
    <Field label={label} error={error} hint={isISODate(value) ? formatDate(value) : undefined}>
      <input
        type="date"
        className={inputClassName(Boolean(error))}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  )
}

export function TextField({
  label,
  value,
  onChange,
  hint,
  error,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  hint?: string
  error?: string
}) {
  return (
    <Field label={label} hint={hint} error={error}>
      <input className={inputClassName(Boolean(error))} autoComplete="off" value={value} onChange={(event) => onChange(event.target.value)} />
    </Field>
  )
}
