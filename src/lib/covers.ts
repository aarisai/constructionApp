import type { AppState } from '../types'

export interface SiteCover {
  id: string
  label: string
  src: string
}

/** Sample house photos, saved locally so the book still opens offline. */
export const SITE_COVERS: SiteCover[] = [
  { id: 'garden', label: 'Garden house', src: '/covers/garden-house.jpg' },
  { id: 'white', label: 'White villa', src: '/covers/villa-dusk.jpg' },
  { id: 'sky', label: 'Sky villa', src: '/covers/twilight-home.jpg' },
  { id: 'palm', label: 'Palm house', src: '/covers/lawn-house.jpg' },
  { id: 'night', label: 'Night cottage', src: '/covers/night-cottage.jpg' },
  { id: 'porch', label: 'Porch house', src: '/covers/brick-home.jpg' },
  { id: 'slab', label: 'Slab work', src: '/covers/new-frames.jpg' },
]

const NAMED_COVERS: Record<string, string> = {
  'site-jp': '/covers/garden-house.jpg',
  'site-wf': '/covers/villa-dusk.jpg',
}

export function coverSrc(site: { id: string; coverUrl?: string }, index = 0): string {
  const url = site.coverUrl?.trim()
  if (url) return url
  return defaultCover(site.id, index)
}

export function ensureCovers(state: AppState): AppState {
  let changed = false
  const sites = state.sites.map((site, index) => {
    if (site.coverUrl?.trim()) return site
    changed = true
    return { ...site, coverUrl: defaultCover(site.id, index) }
  })
  if (!changed) return state
  return { ...state, sites }
}

function defaultCover(id: string, index: number): string {
  const named = NAMED_COVERS[id]
  if (named) return named
  const slot = (hash(id) + index) % SITE_COVERS.length
  return SITE_COVERS[slot].src
}

function hash(value: string): number {
  let total = 0
  for (let index = 0; index < value.length; index += 1) {
    total = (total * 33 + value.charCodeAt(index)) >>> 0
  }
  return total
}
