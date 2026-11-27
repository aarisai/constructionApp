import { useMemo, useState } from 'react'
import { useStore } from '../context/Store'
import { SiteCard } from '../components/SiteCard'
import { buttonClass, Empty, PageHeader } from '../components/ui'

export function Sites() {
  const { state } = useStore()
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return state.sites.filter((site) => {
      if (!needle) return true
      return `${site.name} ${site.locality} ${site.ownerName}`.toLowerCase().includes(needle)
    })
  }, [query, state.sites])
  const active = filtered.filter((site) => site.active)
  const inactive = filtered.filter((site) => !site.active)

  return (
    <div>
      <PageHeader
        title="Sites"
        subtitle="Houses and apartment blocks in progress."
        action={
          <a href="#/sites/new" className={buttonClass('primary')}>
            Add site
          </a>
        }
      />
      <label className="mb-4 block">
        <span className="sr-only">Search sites</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by site, area, or owner"
          className="min-h-12 w-full rounded-2xl border border-line bg-card px-3 text-base"
        />
      </label>
      {state.sites.length === 0 ? (
        <Empty title="No sites yet" body="Add a house or apartment block to start tracking money." action={<a href="#/sites/new" className={buttonClass('primary')}>Add site</a>} />
      ) : filtered.length === 0 ? (
        <Empty title="No matching sites" body="Try another name, locality, or owner." />
      ) : (
        <div className="space-y-6">
          <SiteGroup title="Active" sites={active} />
          <SiteGroup title="Inactive" sites={inactive} />
        </div>
      )}
    </div>
  )
}

function SiteGroup({ title, sites }: { title: string; sites: ReturnType<typeof useStore>['state']['sites'] }) {
  if (sites.length === 0) return null
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-muted">{title}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {sites.map((site) => (
          <SiteCard key={site.id} site={site} />
        ))}
      </div>
    </section>
  )
}
