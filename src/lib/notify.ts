export function notify(message: string): void {
  window.dispatchEvent(new CustomEvent('sankalpa-toast', { detail: message }))
}

export const QUICK_ENTRY_EVENT = 'sankalpa-quick-entry'

export type EntryType = 'owner' | 'material' | 'labour' | 'photo'

export interface QuickEntryDetail {
  siteId?: string
  type?: EntryType
}

export function openQuickEntry(detail: QuickEntryDetail = {}): void {
  window.dispatchEvent(new CustomEvent<QuickEntryDetail>(QUICK_ENTRY_EVENT, { detail }))
}
