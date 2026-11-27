import { useState, type FormEvent } from 'react'
import { useStore } from '../context/Store'
import { ownerBillable } from '../lib/calc'
import { digitsOnly, formatINR, isISODate, parseAmount, parsePercent, toISODate } from '../lib/format'
import { uid } from '../lib/id'
import { notify } from '../lib/notify'
import { SITE_COVERS } from '../lib/covers'
import { standardMilestones } from '../lib/presets'
import { LOCALITIES, STAGES, type ContractType, type FixedPricing, type Site, type Stage } from '../types'
import { SitePhoto } from '../components/SitePhoto'
import { Button, ConfirmDialog, cx, Field, inputClassName, NotFound, PageHeader, Segmented } from '../components/ui'

interface MilestoneDraft {
  id: string
  name: string
  percent: string
}

interface Draft {
  name: string
  locality: string
  plotSize: string
  area: string
  ownerName: string
  ownerPhone: string
  startDate: string
  stage: Stage
  active: boolean
  coverUrl: string
  contractType: ContractType
  fixedPricing: FixedPricing
  rate: string
  lump: string
  fee: string
  milestones: MilestoneDraft[]
}

export function SiteForm({ siteId }: { siteId?: string }) {
  const store = useStore()
  const existing = siteId ? store.state.sites.find((site) => site.id === siteId) : undefined
  const [draft, setDraft] = useState<Draft>(() => (existing ? fromSite(existing) : blankDraft()))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (siteId && !existing) {
    return <NotFound title="Site not found" body="This site is not on this phone." href="#/sites" action="Back to sites" />
  }

  const preview = contractPreview(draft, store.state, existing)
  const loggedCosts = existing
    ? ownerBillable(store.state, { ...existing, contractType: 'cost-plus', feePercent: 0 })
    : 0

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const nextErrors: Record<string, string> = {}
    const area = Number(draft.area)
    const phone = digitsOnly(draft.ownerPhone)
    if (!draft.name.trim()) nextErrors.name = 'Enter the site name.'
    if (!draft.locality.trim()) nextErrors.locality = 'Enter the Bengaluru locality.'
    if (!Number.isFinite(area) || area <= 0) nextErrors.area = 'Enter the built-up area in sq.ft.'
    if (!draft.ownerName.trim()) nextErrors.ownerName = 'Enter the owner’s name.'
    if (phone.length !== 10) nextErrors.ownerPhone = 'Enter a 10-digit mobile number.'
    if (!isISODate(draft.startDate)) nextErrors.startDate = 'Choose a valid start date.'
    if (draft.contractType === 'fixed') {
      const rate = parseAmount(draft.rate)
      const lump = parseAmount(draft.lump)
      if (draft.fixedPricing === 'rate' && (rate == null || rate <= 0)) nextErrors.rate = 'Enter the rate per sq.ft.'
      if (draft.fixedPricing === 'lump' && (lump == null || lump <= 0)) nextErrors.lump = 'Enter the lump-sum contract value.'
      if (draft.milestones.length === 0) nextErrors.milestones = 'Add at least one payment stage.'
      draft.milestones.forEach((milestone, index) => {
        if (!milestone.name.trim()) nextErrors[`m-name-${index}`] = 'Name this stage.'
        if (parsePercent(milestone.percent) == null) nextErrors[`m-pct-${index}`] = 'Enter a percent from 1 to 100.'
      })
    } else {
      const fee = Number(draft.fee)
      if (!Number.isFinite(fee) || fee <= 0 || fee > 100) nextErrors.fee = 'Enter your fee percent. Example: 12.'
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    const site = toSite(draft, existing)
    store.saveSite(site)
    notify(existing ? 'Site updated' : 'Site saved')
    window.location.hash = `#/sites/${site.id}/owner`
  }

  const percentTotal = draft.milestones.reduce((total, milestone) => total + (parsePercent(milestone.percent) ?? 0), 0)

  return (
    <form onSubmit={onSubmit} className="pb-44">
      <PageHeader title={existing ? 'Edit site' : 'New site'} subtitle="Fixed turnkey rate, or cost plus your fee." back="#/sites" />
      <div className="space-y-4">
        <Field label="Site name" error={errors.name}>
          <input className={inputClassName(Boolean(errors.name))} value={draft.name} onChange={(event) => update('name', event.target.value)} />
        </Field>
        <Field label="Locality in Bengaluru" error={errors.locality}>
          <input className={inputClassName(Boolean(errors.locality))} list="localities" value={draft.locality} onChange={(event) => update('locality', event.target.value)} />
          <datalist id="localities">
            {LOCALITIES.map((locality) => (
              <option key={locality} value={locality} />
            ))}
          </datalist>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Plot size" hint="Optional. Example: 30 × 40">
            <input className={inputClassName()} value={draft.plotSize} onChange={(event) => update('plotSize', event.target.value)} />
          </Field>
          <Field label="Built-up area (sq.ft)" error={errors.area}>
            <input className={inputClassName(Boolean(errors.area))} inputMode="decimal" value={draft.area} onChange={(event) => update('area', event.target.value)} />
          </Field>
        </div>
        <fieldset>
          <legend className="mb-1.5 text-sm font-semibold">Site photo</legend>
          <SitePhoto src={draft.coverUrl} alt="Selected site photo" className="h-32 w-full rounded-2xl object-cover" />
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {SITE_COVERS.map((cover) => {
              const selected = draft.coverUrl === cover.src
              return (
                <button
                  key={cover.id}
                  type="button"
                  onClick={() => update('coverUrl', cover.src)}
                  aria-pressed={selected}
                  className={cx(
                    'w-24 shrink-0 overflow-hidden rounded-xl ring-2 ring-offset-2 ring-offset-paper',
                    selected ? 'ring-brand' : 'ring-transparent',
                  )}
                >
                  <SitePhoto src={cover.src} alt={cover.label} className="h-16 w-full object-cover" />
                </button>
              )
            })}
          </div>
          <label className="mt-3 block">
            <span className="mb-1.5 block text-sm font-semibold">Or paste an image link</span>
            <input
              className={inputClassName()}
              inputMode="url"
              placeholder="https://"
              value={SITE_COVERS.some((cover) => cover.src === draft.coverUrl) ? '' : draft.coverUrl}
              onChange={(event) => update('coverUrl', event.target.value.trim() || SITE_COVERS[0].src)}
            />
            <span className="mt-1 block text-sm text-muted">Sample pictures for now. Paste a link when you have the real site photo.</span>
          </label>
        </fieldset>
        <Field label="Owner name" error={errors.ownerName}>
          <input className={inputClassName(Boolean(errors.ownerName))} value={draft.ownerName} onChange={(event) => update('ownerName', event.target.value)} />
        </Field>
        <Field label="Owner phone" error={errors.ownerPhone}>
          <input className={inputClassName(Boolean(errors.ownerPhone))} inputMode="numeric" value={draft.ownerPhone} onChange={(event) => update('ownerPhone', event.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Start date" error={errors.startDate}>
            <input type="date" className={inputClassName(Boolean(errors.startDate))} value={draft.startDate} onChange={(event) => update('startDate', event.target.value)} />
          </Field>
          <Field label="Current stage">
            <select className={inputClassName()} value={draft.stage} onChange={(event) => update('stage', event.target.value as Stage)}>
              {STAGES.map((stage) => (
                <option key={stage}>{stage}</option>
              ))}
            </select>
          </Field>
        </div>
        <Segmented
          label="Contract type"
          value={draft.contractType}
          onChange={(contractType) => {
            update('contractType', contractType)
            if (contractType === 'cost-plus' && (!draft.fee || draft.fee === '0')) update('fee', '12')
          }}
          options={[
            { value: 'fixed', label: 'Fixed turnkey' },
            { value: 'cost-plus', label: 'Cost-plus %' },
          ]}
        />
        {draft.contractType === 'fixed' ? (
          <div className="space-y-4 rounded-3xl border border-line bg-card p-4">
            <Segmented
              label="How the fixed price is set"
              value={draft.fixedPricing}
              onChange={(fixedPricing) => update('fixedPricing', fixedPricing)}
              options={[
                { value: 'rate', label: 'Rate / sq.ft' },
                { value: 'lump', label: 'Lump sum' },
              ]}
            />
            {draft.fixedPricing === 'rate' ? (
              <Field label="Rate per sq.ft" error={errors.rate} hint="Example: 2650">
                <input className={inputClassName(Boolean(errors.rate))} inputMode="decimal" value={draft.rate} onChange={(event) => update('rate', event.target.value)} />
              </Field>
            ) : (
              <Field label="Total lump-sum value" error={errors.lump}>
                <input className={inputClassName(Boolean(errors.lump))} inputMode="decimal" value={draft.lump} onChange={(event) => update('lump', event.target.value)} />
              </Field>
            )}
            <p className="text-sm font-semibold">Contract value {preview == null ? '—' : formatINR(preview)}</p>
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-semibold">Stage payments</h2>
              <button
                type="button"
                className="min-h-11 text-sm font-semibold"
                onClick={() => {
                  if (draft.milestones.length > 0 && !window.confirm('Replace the current stages with the standard schedule?')) return
                  update('milestones', standardMilestones().map((milestone) => ({ ...milestone, percent: String(milestone.percent) })))
                }}
              >
                Use standard schedule
              </button>
            </div>
            <p className="text-sm text-muted">Receipts fill these stages in order. The owner still owes the full contract minus payments.</p>
            {errors.milestones ? <p className="text-sm font-medium text-due">{errors.milestones}</p> : null}
            <div className="space-y-3">
              {draft.milestones.map((milestone, index) => {
                const percent = parsePercent(milestone.percent)
                const amount = preview != null && percent != null ? Math.round((preview * percent) / 100) : null
                return (
                  <div key={milestone.id} className="rounded-2xl border border-line p-3">
                    <Field label={`Stage ${index + 1}`} error={errors[`m-name-${index}`]}>
                      <input
                        className={inputClassName(Boolean(errors[`m-name-${index}`]))}
                        value={milestone.name}
                        onChange={(event) => updateMilestone(index, { name: event.target.value })}
                      />
                    </Field>
                    <div className="mt-2 grid grid-cols-[1fr_auto] items-end gap-2">
                      <Field label="Percent" error={errors[`m-pct-${index}`]}>
                        <input
                          className={inputClassName(Boolean(errors[`m-pct-${index}`]))}
                          inputMode="decimal"
                          value={milestone.percent}
                          onChange={(event) => updateMilestone(index, { percent: event.target.value })}
                        />
                      </Field>
                      <p className="pb-3 text-sm font-semibold tabular-nums">{amount == null ? '—' : formatINR(amount)}</p>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      <Button variant="secondary" disabled={index === 0} onClick={() => moveMilestone(index, -1)}>
                        Up
                      </Button>
                      <Button variant="secondary" disabled={index === draft.milestones.length - 1} onClick={() => moveMilestone(index, 1)}>
                        Down
                      </Button>
                      <Button variant="danger" onClick={() => update('milestones', draft.milestones.filter((item) => item.id !== milestone.id))}>
                        Remove
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
            <Button
              variant="secondary"
              block
              onClick={() => update('milestones', [...draft.milestones, { id: uid(), name: '', percent: '' }])}
            >
              Add stage
            </Button>
            <p className={Math.abs(percentTotal - 100) < 0.2 ? 'text-sm font-semibold text-cash' : 'text-sm font-semibold text-wait'}>
              Stages total {Number(percentTotal.toFixed(2))}%
            </p>
          </div>
        ) : (
          <div className="space-y-4 rounded-3xl border border-line bg-card p-4">
            <Field label="Your fee %" error={errors.fee} hint="Owner’s bill = materials + labour + this fee.">
              <input className={inputClassName(Boolean(errors.fee))} inputMode="decimal" value={draft.fee} onChange={(event) => update('fee', event.target.value)} />
            </Field>
            <div className="grid grid-cols-4 gap-2">
              {[8, 10, 12, 15].map((fee) => (
                <button key={fee} type="button" className="min-h-11 rounded-xl border border-line bg-paper text-sm font-semibold" onClick={() => update('fee', String(fee))}>
                  {fee}%
                </button>
              ))}
            </div>
            <p className="text-sm text-muted">
              {existing
                ? `Costs logged so far ${formatINR(loggedCosts)}. At ${draft.fee || 0}%, the owner bill is ${preview == null ? '—' : formatINR(preview)}.`
                : 'The owner bill starts at ₹0 and grows as you log material and labour.'}
            </p>
          </div>
        )}
        <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-line bg-card px-3">
          <input type="checkbox" className="size-5" checked={draft.active} onChange={(event) => update('active', event.target.checked)} />
          <span>
            <span className="block font-semibold">Active site</span>
            <span className="block text-sm text-muted">Turn off after handover. The site stays in your backup.</span>
          </span>
        </label>
        {existing ? (
          <Button variant="danger" block onClick={() => setConfirmDelete(true)}>
            Delete site
          </Button>
        ) : null}
      </div>
      <div className="fixed inset-x-0 bottom-[calc(7rem+env(safe-area-inset-bottom))] z-30 mx-auto max-w-5xl px-4">
        <Button type="submit" block>
          Save site
        </Button>
      </div>
      <ConfirmDialog
        open={confirmDelete}
        title={`Delete ${existing?.name ?? 'this site'}?`}
        body="Payments, bills, kharchi, and photos for this site will be removed. Suppliers stay in your directory."
        confirmLabel="Delete site"
        danger
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          if (!existing) return
          store.deleteSite(existing.id)
          notify('Site deleted')
          window.location.hash = '#/sites'
        }}
      />
    </form>
  )

  function updateMilestone(index: number, patch: Partial<MilestoneDraft>) {
    update(
      'milestones',
      draft.milestones.map((milestone, milestoneIndex) => (milestoneIndex === index ? { ...milestone, ...patch } : milestone)),
    )
  }

  function moveMilestone(index: number, direction: -1 | 1) {
    const next = draft.milestones.slice()
    const target = index + direction
    const current = next[index]
    const swap = next[target]
    if (!current || !swap) return
    next[index] = swap
    next[target] = current
    update('milestones', next)
  }
}

function blankDraft(): Draft {
  return {
    name: '',
    locality: '',
    plotSize: '',
    area: '',
    ownerName: '',
    ownerPhone: '',
    startDate: toISODate(new Date()),
    stage: 'Excavation',
    active: true,
    coverUrl: SITE_COVERS[0].src,
    contractType: 'fixed',
    fixedPricing: 'rate',
    rate: '',
    lump: '',
    fee: '12',
    milestones: standardMilestones().map((milestone) => ({ id: milestone.id, name: milestone.name, percent: String(milestone.percent) })),
  }
}

function fromSite(site: Site): Draft {
  return {
    name: site.name,
    locality: site.locality,
    plotSize: site.plotSize,
    area: String(site.areaSqFt),
    ownerName: site.ownerName,
    ownerPhone: site.ownerPhone,
    startDate: site.startDate,
    stage: site.stage,
    active: site.active,
    coverUrl: site.coverUrl || SITE_COVERS[0].src,
    contractType: site.contractType,
    fixedPricing: site.fixedPricing,
    rate: site.ratePerSqFt ? String(site.ratePerSqFt) : '',
    lump: site.lumpSumValue ? String(site.lumpSumValue) : '',
    fee: String(site.feePercent || 12),
    milestones: site.milestones.map((milestone) => ({ id: milestone.id, name: milestone.name, percent: String(milestone.percent) })),
  }
}

function toSite(draft: Draft, existing?: Site): Site {
  const area = Number(draft.area)
  return {
    id: existing?.id ?? uid(),
    name: draft.name.trim(),
    locality: draft.locality.trim(),
    plotSize: draft.plotSize.trim(),
    areaSqFt: area,
    ownerName: draft.ownerName.trim(),
    ownerPhone: digitsOnly(draft.ownerPhone),
    startDate: draft.startDate,
    stage: draft.stage,
    active: draft.active,
    coverUrl: draft.coverUrl.trim() || SITE_COVERS[0].src,
    contractType: draft.contractType,
    fixedPricing: draft.fixedPricing,
    ratePerSqFt: parseAmount(draft.rate) ?? 0,
    lumpSumValue: parseAmount(draft.lump) ?? 0,
    milestones: draft.milestones.map((milestone) => ({
      id: milestone.id,
      name: milestone.name.trim(),
      percent: parsePercent(milestone.percent) ?? 0,
    })),
    feePercent: Number(draft.fee) || 0,
    createdAt: existing?.createdAt ?? toISODate(new Date()),
  }
}

function contractPreview(draft: Draft, state: Parameters<typeof ownerBillable>[0], existing?: Site): number | null {
  if (draft.contractType === 'fixed') {
    const area = Number(draft.area)
    if (draft.fixedPricing === 'rate') {
      const rate = parseAmount(draft.rate) ?? 0
      if (rate <= 0 || !(area > 0)) return null
      return Math.round(rate * area)
    }
    const lump = parseAmount(draft.lump) ?? 0
    return lump > 0 ? lump : null
  }
  const fee = Number(draft.fee)
  if (!Number.isFinite(fee) || fee < 0) return null
  if (!existing) return 0
  return ownerBillable(state, { ...existing, contractType: 'cost-plus', feePercent: fee })
}
