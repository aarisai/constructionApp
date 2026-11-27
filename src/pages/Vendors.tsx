import { useMemo, useState } from 'react'
import { useStore } from '../context/Store'
import { vendorSummaries } from '../lib/calc'
import { dueLabel, formatINR, formatPhone } from '../lib/format'
import { toHash } from '../lib/routes'
import { Badge, Empty, PageHeader, Segmented } from '../components/ui'

type Filter = 'all' | 'material' | 'labour'

export function Vendors() {
  const { state } = useStore()
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const summaries = useMemo(() => vendorSummaries(state), [state])
  const visible = summaries.filter((vendor) => {
    if (filter !== 'all' && vendor.kind !== filter) return false
    const needle = query.trim().toLowerCase()
    if (!needle) return true
    return `${vendor.name} ${vendor.trade}`.toLowerCase().includes(needle)
  })
  const advance = summaries.reduce((total, vendor) => total + Math.max(0, vendor.advance), 0)

  return (
    <div>
      <PageHeader title="Vendors" subtitle="Material suppliers and labour mestris, across every site." />
      {advance > 0 ? (
        <p className="mb-4 rounded-2xl bg-wait-soft px-3 py-3 text-sm text-wait">
          Advances not yet adjusted: <strong>{formatINR(advance)}</strong>
        </p>
      ) : null}
      <div className="mb-3">
        <Segmented
          label="Vendor type"
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: 'All' },
            { value: 'material', label: 'Material' },
            { value: 'labour', label: 'Labour' },
          ]}
        />
      </div>
      <label className="mb-4 block">
        <span className="sr-only">Search vendors</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name or trade"
          className="min-h-12 w-full rounded-2xl border border-line bg-card px-3 text-base"
        />
      </label>
      {state.vendors.length === 0 ? (
        <Empty title="No vendors yet" body="They are added when you log a material bill or a labour contract." />
      ) : visible.length === 0 ? (
        <Empty title="No matching vendors" body="Try another name, or switch the material and labour filter." />
      ) : (
        <ul className="space-y-3">
          {visible.map((vendor) => {
            const due = vendor.nextDays == null ? null : dueLabel(vendor.nextDays)
            return (
              <li key={vendor.vendorId}>
                <a href={toHash({ name: 'vendor', id: vendor.vendorId })} className="block rounded-3xl border border-white/70 bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className="grid size-12 shrink-0 place-items-center rounded-2xl text-sm font-semibold text-white"
                      style={{ background: vendorSwatch(vendor.name) }}
                      aria-hidden="true"
                    >
                      {vendorInitials(vendor.name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-lg font-semibold">{vendor.name}</h2>
                      <p className="text-sm text-muted">
                        {vendor.kind === 'material' ? 'Material' : 'Labour'}
                        {vendor.trade ? ` · ${vendor.trade}` : ''}
                      </p>
                      {vendor.phone ? <p className="text-sm">{formatPhone(vendor.phone)}</p> : null}
                    </div>
                    {vendor.pending > 0 ? <Badge tone={vendor.overdue ? 'due' : 'wait'}>{vendor.overdue ? 'Overdue' : 'Credit'}</Badge> : vendor.advance > 0 ? <Badge tone="wait">Advance</Badge> : <Badge tone="cash">Clear</Badge>}
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="rounded-2xl bg-paper px-3 py-2">
                      <p className="text-xs font-semibold text-muted">{vendor.kind === 'labour' ? 'Left on contracts' : 'Pending credit'}</p>
                      <p className={vendor.pending > 0 ? 'mt-1 font-semibold tabular-nums text-out' : 'mt-1 font-semibold tabular-nums text-cash'}>
                        {formatINR(vendor.pending)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-paper px-3 py-2">
                      <p className="text-xs font-semibold text-muted">Advance balance</p>
                      <p className={vendor.advance > 0 ? 'mt-1 font-semibold tabular-nums text-wait' : 'mt-1 font-semibold tabular-nums'}>
                        {formatINR(Math.max(0, vendor.advance))}
                      </p>
                    </div>
                  </div>
                  {due && due.text ? <p className={due.tone === 'due' ? 'mt-2 text-sm font-semibold text-due' : 'mt-2 text-sm font-semibold text-wait'}>{due.text}</p> : null}
                </a>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

const VENDOR_SWATCHES = ['#be185d', '#0f766e', '#c2410c', '#6d28d9', '#0d8a62', '#9a3412']

function vendorSwatch(name: string): string {
  let hash = 0
  for (let index = 0; index < name.length; index += 1) hash = (hash * 31 + name.charCodeAt(index)) >>> 0
  return VENDOR_SWATCHES[hash % VENDOR_SWATCHES.length]
}

function vendorInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}
