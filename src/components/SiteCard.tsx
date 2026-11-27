import { Plus } from 'lucide-react'
import { useStore } from '../context/Store'
import { contractLabel, siteMoney } from '../lib/calc'
import { coverSrc } from '../lib/covers'
import { formatArea, formatINR, stageProgress } from '../lib/format'
import { openQuickEntry } from '../lib/notify'
import { toHash } from '../lib/routes'
import type { Site } from '../types'
import { SitePhoto } from './SitePhoto'
import { Meter } from './ui'

export function SiteCard({ site }: { site: Site }) {
  const { state } = useStore()
  const money = siteMoney(state, site)
  const place = site.plotSize ? `${site.plotSize} · ${formatArea(site.areaSqFt)}` : formatArea(site.areaSqFt)
  const progress = stageProgress(site.stage)
  return (
    <article className="flex flex-col overflow-hidden rounded-[1.6rem] border border-white/70 bg-card shadow-[0_18px_40px_-24px_rgba(80,24,48,0.55)]">
      <a href={toHash({ name: 'site', id: site.id, tab: 'owner' })} className="block">
        <div className="relative h-44 sm:h-48">
          <SitePhoto
            src={coverSrc(site)}
            alt={`${site.name}, ${site.locality}`}
            className={site.active ? 'h-full w-full object-cover' : 'h-full w-full object-cover saturate-50'}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-black/10" />
          <span className="absolute left-3 top-3 rounded-full bg-white/92 px-2.5 py-1 text-xs font-semibold text-[#241828]">
            {contractLabel(site)}
          </span>
          {!site.active ? (
            <span className="absolute right-3 top-3 rounded-full bg-[#a15c00] px-2.5 py-1 text-xs font-semibold text-white">Inactive</span>
          ) : null}
          <div className="absolute inset-x-0 bottom-0 px-4 pb-3 text-white">
            <h2 className="truncate font-display text-2xl leading-tight">{site.name}</h2>
            <p className="text-sm text-white/85">{site.locality}</p>
          </div>
        </div>
        <div className="space-y-3 p-3">
          <div>
            <div className="mb-1 flex items-center justify-between gap-2 text-xs font-semibold">
              <span>{site.stage}</span>
              <span className="tabular-nums text-muted">
                {place} · {progress}%
              </span>
            </div>
            <Meter value={progress} max={100} tone="brand" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <figure className="rounded-2xl bg-cash-soft px-3 py-2">
              <figcaption className="text-xs font-semibold text-cash">Still to receive</figcaption>
              <p className="mt-1 font-semibold tabular-nums text-cash">{formatINR(money.ownerPending)}</p>
            </figure>
            <figure className={money.payable > 0 ? 'rounded-2xl bg-out-soft px-3 py-2' : 'rounded-2xl bg-cash-soft px-3 py-2'}>
              <figcaption className={money.payable > 0 ? 'text-xs font-semibold text-out' : 'text-xs font-semibold text-cash'}>Still to pay</figcaption>
              <p className={money.payable > 0 ? 'mt-1 font-semibold tabular-nums text-out' : 'mt-1 font-semibold tabular-nums text-cash'}>
                {formatINR(money.payable)}
              </p>
            </figure>
          </div>
        </div>
      </a>
      <div className="px-3 pb-3">
        <button
          type="button"
          onClick={() => openQuickEntry({ siteId: site.id })}
          className="brand-gradient inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-3 text-sm font-semibold"
        >
          <Plus size={18} />
          Log entry
        </button>
      </div>
    </article>
  )
}
