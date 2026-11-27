export type SiteTab = 'owner' | 'needs' | 'material' | 'labour' | 'progress'

export const SITE_TABS: SiteTab[] = ['owner', 'needs', 'material', 'labour', 'progress']

export type Route =
  | { name: 'home' }
  | { name: 'sites' }
  | { name: 'site-new' }
  | { name: 'site'; id: string; tab: SiteTab }
  | { name: 'site-edit'; id: string }
  | { name: 'vendors' }
  | { name: 'vendor'; id: string }
  | { name: 'reports' }
  | { name: 'owner-report'; id: string }

function isTab(value: string | undefined): value is SiteTab {
  return SITE_TABS.includes(value as SiteTab)
}

export function parseHash(hash: string): Route {
  const parts = hash.replace(/^#/, '').replace(/^\//, '').split('/').filter(Boolean)
  if (parts.length === 0) return { name: 'home' }
  if (parts[0] === 'sites') {
    if (parts.length === 1) return { name: 'sites' }
    if (parts[1] === 'new') return { name: 'site-new' }
    const id = decodeURIComponent(parts[1] ?? '')
    if (parts[2] === 'edit') return { name: 'site-edit', id }
    return { name: 'site', id, tab: isTab(parts[2]) ? parts[2] : 'owner' }
  }
  if (parts[0] === 'vendors') {
    if (!parts[1]) return { name: 'vendors' }
    return { name: 'vendor', id: decodeURIComponent(parts[1]) }
  }
  if (parts[0] === 'reports') {
    if (parts[1] === 'owner' && parts[2]) return { name: 'owner-report', id: decodeURIComponent(parts[2]) }
    return { name: 'reports' }
  }
  return { name: 'home' }
}

export function toHash(route: Route): string {
  switch (route.name) {
    case 'home':
      return '#/'
    case 'sites':
      return '#/sites'
    case 'site-new':
      return '#/sites/new'
    case 'site':
      return `#/sites/${encodeURIComponent(route.id)}/${route.tab}`
    case 'site-edit':
      return `#/sites/${encodeURIComponent(route.id)}/edit`
    case 'vendors':
      return '#/vendors'
    case 'vendor':
      return `#/vendors/${encodeURIComponent(route.id)}`
    case 'reports':
      return '#/reports'
    case 'owner-report':
      return `#/reports/owner/${encodeURIComponent(route.id)}`
  }
}
