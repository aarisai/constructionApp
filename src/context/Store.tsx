import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  allPhotos,
  deletePhoto,
  loadState,
  savePhoto,
  saveState,
  type StoredPhoto,
} from '../lib/db'
import { buildBackup, buildLedgerCsv, dataUrlToBlob, downloadText, parseBackup, stamp } from '../lib/export'
import { digitsOnly } from '../lib/format'
import { uid } from '../lib/id'
import { compressImage, createSamplePhotos } from '../lib/images'
import { notify } from '../lib/notify'
import { prepareState } from '../lib/prepare'
import { createSampleState, emptyState, SAMPLE_SITE_IDS } from '../lib/sample'
import type {
  AppState,
  Kharchi,
  LabourContract,
  MaterialBill,
  MaterialRequest,
  NewVendorInput,
  OwnerPayment,
  ProgressUpdate,
  Settings,
  Site,
  Vendor,
  VendorPayment,
} from '../types'

export interface StoreApi {
  state: AppState
  photoUrl: (id: string | null | undefined) => string | null
  error: string | null
  clearError: () => void
  saveSite: (site: Site) => void
  deleteSite: (id: string) => void
  saveVendor: (vendor: Vendor) => void
  deleteVendor: (id: string) => boolean
  saveOwnerPayment: (payment: OwnerPayment) => void
  deleteOwnerPayment: (id: string) => void
  saveMaterialBill: (bill: MaterialBill, vendor?: NewVendorInput) => void
  deleteMaterialBill: (id: string) => void
  saveLabourContract: (contract: LabourContract, vendor?: NewVendorInput) => void
  deleteLabourContract: (id: string) => void
  saveKharchi: (entry: Kharchi) => void
  deleteKharchi: (id: string) => void
  saveVendorPayment: (payment: VendorPayment) => void
  deleteVendorPayment: (id: string) => void
  saveProgress: (entry: ProgressUpdate) => void
  deleteProgress: (id: string) => void
  saveRequest: (request: MaterialRequest) => void
  deleteRequest: (id: string) => void
  attachPhoto: (file: File) => Promise<string>
  updateSettings: (settings: Settings) => void
  dismissSample: () => void
  exportJson: () => Promise<void>
  exportCsv: () => void
  importJson: (file: File) => Promise<void>
  restoreSample: () => Promise<void>
  clearAll: () => Promise<void>
}

const StoreContext = createContext<StoreApi | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(createSampleState)
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const stateRef = useRef<AppState | null>(state)
  const saveChain = useRef(Promise.resolve())

  const publishUrls = useCallback((photos: StoredPhoto[]) => {
    setPhotoUrls((previous) => {
      for (const url of Object.values(previous)) URL.revokeObjectURL(url)
      return Object.fromEntries(photos.map((photo) => [photo.id, URL.createObjectURL(photo.blob)]))
    })
  }, [])

  const replaceAll = useCallback(
    async (next: AppState, photos: StoredPhoto[]) => {
      const keep = new Set(photos.map((photo) => photo.id))
      for (const photo of photos) await savePhoto(photo)
      await saveState(next)
      const existing = await allPhotos()
      for (const photo of existing) {
        if (!keep.has(photo.id)) await deletePhoto(photo.id)
      }
      stateRef.current = next
      setState(next)
      publishUrls(photos)
    },
    [publishUrls],
  )

  useEffect(() => {
    let gone = false
    const placeholder = stateRef.current

    async function openBook() {
      let saved: AppState | null = null
      try {
        saved = await loadState()
      } catch {
        if (!gone) setError('This phone blocked saved data. You can look around, but a reload may clear it.')
      }
      if (gone) return

      if (saved && Array.isArray(saved.sites)) {
        if (stateRef.current === placeholder) {
          const next = prepareState(saved)
          stateRef.current = next
          setState(next)
          if (next !== saved) void saveState(next).catch(() => undefined)
        }
        try {
          const photos = await allPhotos()
          if (!gone) publishUrls(photos)
        } catch {
          if (!gone) setError('Saved photos could not be opened. The numbers are still here.')
        }
        return
      }

      if (!placeholder || stateRef.current !== placeholder) return
      try {
        const photos = await sampleRecords()
        if (gone || stateRef.current !== placeholder) return
        await replaceAll(placeholder, photos)
      } catch {
        if (!gone) setError('Sample photos could not be saved. The sites are still here.')
      }
    }

    void openBook()
    return () => {
      gone = true
    }
  }, [publishUrls, replaceAll])

  const commit = useCallback((recipe: (prev: AppState) => AppState) => {
    const previous = stateRef.current
    if (!previous) return
    const next = dropSampleBanner(recipe(previous))
    const removed = [...collectPhotoIds(previous)].filter((id) => !collectPhotoIds(next).has(id))
    stateRef.current = next
    setState(next)
    if (removed.length > 0) {
      setPhotoUrls((urls) => {
        const copy = { ...urls }
        for (const id of removed) {
          if (copy[id]) URL.revokeObjectURL(copy[id])
          delete copy[id]
        }
        return copy
      })
    }
    saveChain.current = saveChain.current
      .then(async () => {
        await saveState(next)
        await Promise.all(removed.map((id) => deletePhoto(id)))
      })
      .catch(() => {
        setError("Couldn't save just now. Stay on this page and try again.")
      })
  }, [])

  const api = useMemo<StoreApi>(() => {
    const current = state ?? emptyState()
    return {
      state: current,
      photoUrl: (id) => (id ? (photoUrls[id] ?? null) : null),
      error,
      clearError: () => setError(null),
      saveSite: (site) => commit((prev) => ({ ...prev, sites: upsert(prev.sites, site) })),
      deleteSite: (id) =>
        commit((prev) => ({
          ...prev,
          sites: withoutId(prev.sites, id),
          ownerPayments: prev.ownerPayments.filter((item) => item.siteId !== id),
          materialBills: prev.materialBills.filter((item) => item.siteId !== id),
          labourContracts: prev.labourContracts.filter((item) => item.siteId !== id),
          kharchi: prev.kharchi.filter((item) => item.siteId !== id),
          vendorPayments: prev.vendorPayments.filter((item) => item.siteId !== id),
          progress: prev.progress.filter((item) => item.siteId !== id),
          materialRequests: (prev.materialRequests ?? []).filter((item) => item.siteId !== id),
        })),
      saveVendor: (vendor) => commit((prev) => ({ ...prev, vendors: upsert(prev.vendors, vendor) })),
      deleteVendor: (id) => {
        const latest = stateRef.current
        if (!latest) return false
        const used =
          latest.materialBills.some((item) => item.vendorId === id) ||
          latest.labourContracts.some((item) => item.vendorId === id) ||
          latest.kharchi.some((item) => item.vendorId === id) ||
          latest.vendorPayments.some((item) => item.vendorId === id) ||
          (latest.materialRequests ?? []).some((item) => item.vendorId === id)
        if (used) {
          setError('This vendor still has bills, contracts, or a material list. Clear those first.')
          return false
        }
        commit((prev) => ({ ...prev, vendors: withoutId(prev.vendors, id) }))
        return true
      },
      saveOwnerPayment: (payment) =>
        commit((prev) => ({ ...prev, ownerPayments: upsert(prev.ownerPayments, payment) })),
      deleteOwnerPayment: (id) =>
        commit((prev) => ({ ...prev, ownerPayments: withoutId(prev.ownerPayments, id) })),
      saveMaterialBill: (bill, vendor) =>
        commit((prev) => {
          const linked = withVendor(prev, vendor)
          const vendorId = linked.vendorId ?? bill.vendorId
          return { ...linked.state, materialBills: upsert(linked.state.materialBills, { ...bill, vendorId }) }
        }),
      deleteMaterialBill: (id) =>
        commit((prev) => ({ ...prev, materialBills: withoutId(prev.materialBills, id) })),
      saveLabourContract: (contract, vendor) =>
        commit((prev) => {
          const linked = withVendor(prev, vendor)
          const vendorId = linked.vendorId ?? contract.vendorId
          return {
            ...linked.state,
            labourContracts: upsert(linked.state.labourContracts, { ...contract, vendorId }),
          }
        }),
      deleteLabourContract: (id) =>
        commit((prev) => ({
          ...prev,
          labourContracts: withoutId(prev.labourContracts, id),
          kharchi: prev.kharchi.filter((item) => item.contractId !== id),
          vendorPayments: prev.vendorPayments.filter((item) => item.contractId !== id),
        })),
      saveKharchi: (entry) => commit((prev) => ({ ...prev, kharchi: upsert(prev.kharchi, entry) })),
      deleteKharchi: (id) => commit((prev) => ({ ...prev, kharchi: withoutId(prev.kharchi, id) })),
      saveVendorPayment: (payment) =>
        commit((prev) => ({ ...prev, vendorPayments: upsert(prev.vendorPayments, payment) })),
      deleteVendorPayment: (id) =>
        commit((prev) => ({ ...prev, vendorPayments: withoutId(prev.vendorPayments, id) })),
      saveProgress: (entry) => commit((prev) => ({ ...prev, progress: upsert(prev.progress, entry) })),
      deleteProgress: (id) => commit((prev) => ({ ...prev, progress: withoutId(prev.progress, id) })),
      saveRequest: (request) =>
        commit((prev) => ({ ...prev, materialRequests: upsert(prev.materialRequests ?? [], request) })),
      deleteRequest: (id) =>
        commit((prev) => ({ ...prev, materialRequests: withoutId(prev.materialRequests ?? [], id) })),
      attachPhoto: async (file) => {
        if (file.size > 25 * 1024 * 1024) {
          throw new Error('This photo is over 25MB. Choose a smaller one.')
        }
        let blob: Blob
        try {
          blob = await compressImage(file)
        } catch {
          throw new Error("Couldn't read that photo. Use a JPG or PNG.")
        }
        const id = uid()
        const record: StoredPhoto = { id, blob, createdAt: new Date().toISOString() }
        await savePhoto(record)
        const url = URL.createObjectURL(blob)
        setPhotoUrls((urls) => ({ ...urls, [id]: url }))
        return id
      },
      updateSettings: (settings) => commit((prev) => ({ ...prev, settings })),
      dismissSample: () => commit((prev) => ({ ...prev, sampleBanner: false })),
      exportJson: async () => {
        const latest = stateRef.current
        if (!latest) return
        try {
          const photos = await allPhotos()
          const backup = await buildBackup(latest, photos)
          downloadText(`sankalpa-backup-${stamp()}.json`, JSON.stringify(backup), 'application/json')
        } catch (exportError) {
          setError(exportError instanceof Error ? exportError.message : 'Could not export the backup.')
        }
      },
      exportCsv: () => {
        const latest = stateRef.current
        if (!latest) return
        downloadText(`sankalpa-ledgers-${stamp()}.csv`, buildLedgerCsv(latest), 'text/csv')
      },
      importJson: async (file) => {
        const text = await file.text()
        const parsed = parseBackup(text)
        const photos = parsed.images.map((image) => ({
          id: image.id,
          blob: dataUrlToBlob(image.data, image.mime),
          createdAt: image.createdAt || new Date().toISOString(),
        }))
        await replaceAll(parsed.state, photos)
        notify('Backup restored')
      },
      restoreSample: async () => {
        const photos = await sampleRecords()
        await replaceAll(createSampleState(), photos)
        notify('Sample sites restored')
      },
      clearAll: async () => {
        const settings = stateRef.current?.settings
        await replaceAll(emptyState(settings), [])
        notify('All site data cleared')
      },
    }
  }, [commit, error, photoUrls, replaceAll, state])

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>
}

export function useStore(): StoreApi {
  const value = useContext(StoreContext)
  if (!value) throw new Error('Store missing')
  return value
}

async function sampleRecords(): Promise<StoredPhoto[]> {
  const drafts = await createSamplePhotos()
  const createdAt = new Date().toISOString()
  return drafts.map((draft) => ({ id: draft.id, blob: draft.blob, createdAt }))
}

function dropSampleBanner(state: AppState): AppState {
  const stillSample = state.sites.some((site) => (SAMPLE_SITE_IDS as readonly string[]).includes(site.id))
  if (!stillSample && state.sampleBanner) return { ...state, sampleBanner: false }
  return state
}

function collectPhotoIds(state: AppState): Set<string> {
  const ids = new Set<string>()
  for (const payment of state.ownerPayments) if (payment.photoId) ids.add(payment.photoId)
  for (const bill of state.materialBills) if (bill.photoId) ids.add(bill.photoId)
  for (const entry of state.kharchi) if (entry.photoId) ids.add(entry.photoId)
  for (const payment of state.vendorPayments) if (payment.photoId) ids.add(payment.photoId)
  for (const update of state.progress) for (const id of update.photoIds) ids.add(id)
  return ids
}

function withVendor(state: AppState, vendor?: NewVendorInput): { state: AppState; vendorId: string | null } {
  if (!vendor) return { state, vendorId: null }
  const name = vendor.name.trim()
  const existing = state.vendors.find(
    (item) => item.kind === vendor.kind && item.name.toLowerCase() === name.toLowerCase(),
  )
  if (existing) return { state, vendorId: existing.id }
  const created: Vendor = {
    id: uid(),
    name,
    phone: digitsOnly(vendor.phone),
    kind: vendor.kind,
    trade: vendor.trade.trim(),
    notes: '',
  }
  return { state: { ...state, vendors: [...state.vendors, created] }, vendorId: created.id }
}

function upsert<T extends { id: string }>(items: T[], item: T): T[] {
  const index = items.findIndex((entry) => entry.id === item.id)
  if (index === -1) return [...items, item]
  return items.map((entry) => (entry.id === item.id ? item : entry))
}

function withoutId<T extends { id: string }>(items: T[], id: string): T[] {
  return items.filter((entry) => entry.id !== id)
}
