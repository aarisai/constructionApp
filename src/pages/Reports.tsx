import { useEffect, useState, type FormEvent } from 'react'
import { useStore } from '../context/Store'
import { siteMoney } from '../lib/calc'
import { coverSrc } from '../lib/covers'
import { formatINR, formatPhone } from '../lib/format'
import { toHash } from '../lib/routes'
import type { Settings } from '../types'
import { SitePhoto } from '../components/SitePhoto'
import { Button, ConfirmDialog, Field, inputClassName, PageHeader } from '../components/ui'

export function Reports() {
  const store = useStore()
  const [settings, setSettings] = useState<Settings>(store.state.settings)
  const [confirm, setConfirm] = useState<null | 'sample' | 'clear'>(null)
  const [importError, setImportError] = useState('')

  useEffect(() => {
    setSettings(store.state.settings)
  }, [store.state.settings])

  function saveHeader(event: FormEvent) {
    event.preventDefault()
    if (!settings.businessName.trim()) return
    store.updateSettings({
      businessName: settings.businessName.trim(),
      tagline: settings.tagline.trim(),
      phone: settings.phone.replace(/\D/g, ''),
      address: settings.address.trim(),
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" subtitle="Owner statements, profit and loss, and a backup of this phone." />
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Owner statements</h2>
        <p className="text-sm text-muted">Client-safe. Supplier names and what you still owe them stay off the printout.</p>
        {store.state.sites.length === 0 ? <p className="text-sm text-muted">Add a site to generate a statement.</p> : null}
        <ul className="space-y-2">
          {store.state.sites.map((site) => (
            <li key={site.id}>
              <a href={toHash({ name: 'owner-report', id: site.id })} className="flex min-h-16 items-center gap-3 overflow-hidden rounded-2xl border border-line bg-card pr-3">
                <SitePhoto src={coverSrc(site)} alt="" className="h-16 w-20 object-cover" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{site.name}</span>
                  <span className="text-sm text-muted">{site.ownerName}</span>
                </span>
                <span className="text-sm font-semibold text-brand">Open</span>
              </a>
            </li>
          ))}
        </ul>
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Profit and loss</h2>
        <p className="text-sm text-muted">Margin uses billed material and agreed labour, not only what you have paid. Finishing costs are still to come, so a fixed-rate margin will fall as you log more bills.</p>
        <div className="grid gap-3">
          {store.state.sites.map((site) => {
            const money = siteMoney(store.state, site)
            const marginLabel = site.contractType === 'cost-plus' ? 'Your fee so far' : 'Margin on costs logged'
            return (
              <article key={site.id} className="rounded-3xl border border-line bg-card p-4">
                <div className="flex items-center gap-3">
                  <SitePhoto src={coverSrc(site)} alt="" className="size-14 rounded-2xl object-cover" />
                  <div>
                    <h3 className="text-lg font-semibold">{site.name}</h3>
                    <p className="text-sm text-muted">{site.contractType === 'fixed' ? 'Fixed contract' : `Cost-plus ${site.feePercent}%`}</p>
                  </div>
                </div>
                <dl className="mt-3 space-y-2 text-sm">
                  <Line label="Owner bill" value={money.billable} />
                  <Line label="Material cost" value={money.materialCost} />
                  <Line label="Labour cost" value={money.labourCost} />
                  <Line label={marginLabel} value={money.feeOrMargin} tone={money.feeOrMargin < 0 ? 'due' : 'cash'} />
                  <Line label="Cash in" value={money.cashIn} tone="cash" />
                  <Line label="Cash out" value={money.cashOut} tone="out" />
                  <Line label="Net cash" value={money.cashIn - money.cashOut} tone={money.cashIn - money.cashOut < 0 ? 'out' : 'cash'} />
                  <Line label="Owner pending" value={money.ownerPending} tone="cash" />
                  <Line label="You still owe" value={money.payable} tone="out" />
                </dl>
                {money.feeOrMargin < 0 ? <p className="mt-2 text-sm text-due">Costs logged are above the contract value.</p> : null}
              </article>
            )
          })}
        </div>
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Backup</h2>
        <p className="text-sm text-muted">JSON keeps the numbers and the photos, and can be restored on this phone. CSV is for Excel. It does not include photos.</p>
        <Button block onClick={() => void store.exportJson()}>
          Download backup (JSON)
        </Button>
        <Button variant="secondary" block onClick={() => store.exportCsv()}>
          Download ledgers (CSV)
        </Button>
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold">Restore a JSON backup</span>
          <input
            type="file"
            accept="application/json,.json"
            className="block w-full text-sm"
            onChange={async (event) => {
              const file = event.target.files?.[0]
              event.target.value = ''
              if (!file) return
              setImportError('')
              try {
                await store.importJson(file)
              } catch (error) {
                setImportError(error instanceof Error ? error.message : 'Could not restore that backup.')
              }
            }}
          />
        </label>
        {importError ? <p className="text-sm font-medium text-due">{importError}</p> : null}
      </section>
      <form className="space-y-3 rounded-3xl border border-line bg-card p-4" onSubmit={saveHeader}>
        <h2 className="text-lg font-semibold">Statement header</h2>
        <p className="text-sm text-muted">This is what the owner sees at the top of the PDF.</p>
        <Field label="Business name">
          <input className={inputClassName()} value={settings.businessName} onChange={(event) => setSettings({ ...settings, businessName: event.target.value })} />
        </Field>
        <Field label="Tagline">
          <input className={inputClassName()} value={settings.tagline} onChange={(event) => setSettings({ ...settings, tagline: event.target.value })} />
        </Field>
        <Field label="Phone" hint={settings.phone ? formatPhone(settings.phone) : undefined}>
          <input className={inputClassName()} inputMode="numeric" value={settings.phone} onChange={(event) => setSettings({ ...settings, phone: event.target.value })} />
        </Field>
        <Field label="Address">
          <textarea className={inputClassName()} rows={2} value={settings.address} onChange={(event) => setSettings({ ...settings, address: event.target.value })} />
        </Field>
        <Button type="submit" block>
          Save statement header
        </Button>
      </form>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Sample data</h2>
        <Button variant="secondary" block onClick={() => setConfirm('sample')}>
          Restore sample data
        </Button>
        <Button variant="danger" block onClick={() => setConfirm('clear')}>
          Clear all data
        </Button>
      </section>
      <ConfirmDialog
        open={confirm === 'sample'}
        title="Restore the sample sites?"
        body="This replaces sites, suppliers, photos, and the statement header with Lakshmi Nilaya and Oakridge Residence."
        confirmLabel="Restore sample"
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          setConfirm(null)
          void store.restoreSample()
        }}
      />
      <ConfirmDialog
        open={confirm === 'clear'}
        title="Clear every site on this phone?"
        body="Sites, suppliers, bills, and photos will be removed. The business name on statements is kept. Download a backup first if you still need the numbers."
        confirmLabel="Clear all data"
        danger
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          setConfirm(null)
          void store.clearAll()
        }}
      />
    </div>
  )
}

function Line({ label, value, tone = 'ink' }: { label: string; value: number; tone?: 'ink' | 'cash' | 'due' | 'out' }) {
  const color = tone === 'cash' ? 'text-cash' : tone === 'out' ? 'text-out' : tone === 'due' ? 'text-due' : 'text-ink'
  return (
    <div className="flex items-center justify-between gap-3">
      <dt>{label}</dt>
      <dd className={`font-semibold tabular-nums ${color}`}>{formatINR(value)}</dd>
    </div>
  )
}
