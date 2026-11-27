import {
  billPending,
  contractRemaining,
  siteMoney,
  vendorName,
  siteName,
} from './calc'
import { formatDate, toISODate } from './format'
import { prepareState } from './prepare'
import type { AppState } from '../types'
import type { StoredPhoto } from './db'

export interface BackupImage {
  id: string
  mime: string
  data: string
  createdAt: string
}

export interface BackupFile {
  app: 'sankalpa-constructions'
  version: 1
  exportedAt: string
  state: AppState
  images: BackupImage[]
}

export async function buildBackup(state: AppState, photos: StoredPhoto[]): Promise<BackupFile> {
  const images: BackupImage[] = []
  for (const photo of photos) {
    images.push({
      id: photo.id,
      mime: photo.blob.type || 'image/jpeg',
      data: await blobToDataUrl(photo.blob),
      createdAt: photo.createdAt,
    })
  }
  return {
    app: 'sankalpa-constructions',
    version: 1,
    exportedAt: new Date().toISOString(),
    state,
    images,
  }
}

export function parseBackup(raw: string): { state: AppState; images: BackupImage[] } {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('That file is not valid JSON. Choose a Sankalpa backup.')
  }
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('This backup is not from Sankalpa Constructions.')
  }
  const file = parsed as Partial<BackupFile>
  if (file.app !== 'sankalpa-constructions' || file.version !== 1 || !isAppState(file.state)) {
    throw new Error('This backup is not from Sankalpa Constructions.')
  }
  const images = Array.isArray(file.images) ? file.images : []
  for (const image of images) {
    if (!image || typeof image.id !== 'string' || typeof image.data !== 'string' || !image.data.includes(',')) {
      throw new Error('A photo in this backup is unreadable.')
    }
  }
  return { state: normalizeState(file.state), images }
}

export function dataUrlToBlob(dataUrl: string, mime: string): Blob {
  const base64 = dataUrl.split(',')[1]
  if (!base64) throw new Error('A photo in this backup is unreadable.')
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
  return new Blob([bytes], { type: mime || 'image/jpeg' })
}

export function buildLedgerCsv(state: AppState): string {
  const lines: string[] = []
  lines.push('# Profit and loss')
  lines.push(
    [
      'Site',
      'Locality',
      'Model',
      'Area sq.ft',
      'Billable',
      'Material cost',
      'Labour cost',
      'Fee or margin',
      'Cash in',
      'Cash out',
      'Net cash',
      'Owner pending',
      'Payable',
    ].join(','),
  )
  for (const site of state.sites) {
    const money = siteMoney(state, site)
    lines.push(
      [
        site.name,
        site.locality,
        site.contractType === 'fixed' ? 'Fixed' : `Cost-plus ${site.feePercent}%`,
        site.areaSqFt,
        money.billable,
        money.materialCost,
        money.labourCost,
        money.feeOrMargin,
        money.cashIn,
        money.cashOut,
        money.cashIn - money.cashOut,
        money.ownerPending,
        money.payable,
      ]
        .map(csvCell)
        .join(','),
    )
  }
  lines.push('')
  lines.push('# Owner payments')
  lines.push(['Site', 'Date', 'Amount', 'Mode', 'Reference', 'Note'].join(','))
  for (const payment of state.ownerPayments) {
    lines.push(
      [siteName(state, payment.siteId), formatDate(payment.date), payment.amount, payment.mode, payment.reference, payment.note]
        .map(csvCell)
        .join(','),
    )
  }
  lines.push('')
  lines.push('# Material bills')
  lines.push(
    ['Site', 'Vendor', 'Date', 'Category', 'Quantity', 'Unit', 'Bill', 'Paid now', 'Advance adjusted', 'Pending', 'Credit due', 'Note'].join(','),
  )
  for (const bill of state.materialBills) {
    lines.push(
      [
        siteName(state, bill.siteId),
        vendorName(state, bill.vendorId),
        formatDate(bill.date),
        bill.category,
        bill.quantity,
        bill.unit,
        bill.totalAmount,
        bill.paidNow,
        bill.advanceAdjusted,
        billPending(state, bill),
        bill.creditDueDate ? formatDate(bill.creditDueDate) : '',
        bill.note,
      ]
        .map(csvCell)
        .join(','),
    )
  }
  lines.push('')
  lines.push('# Labour contracts')
  lines.push(['Site', 'Vendor', 'Trade', 'Date', 'Lump sum', 'Remaining', 'Note'].join(','))
  for (const contract of state.labourContracts) {
    lines.push(
      [
        siteName(state, contract.siteId),
        vendorName(state, contract.vendorId),
        contract.trade,
        formatDate(contract.date),
        contract.lumpSum,
        contractRemaining(state, contract),
        contract.note,
      ]
        .map(csvCell)
        .join(','),
    )
  }
  lines.push('')
  lines.push('# Kharchi')
  lines.push(['Site', 'Vendor', 'Date', 'Amount', 'Mode', 'Reference', 'Note'].join(','))
  for (const entry of state.kharchi) {
    lines.push(
      [siteName(state, entry.siteId), vendorName(state, entry.vendorId), formatDate(entry.date), entry.amount, entry.mode, entry.reference, entry.note]
        .map(csvCell)
        .join(','),
    )
  }
  lines.push('')
  lines.push('# Vendor payments')
  lines.push(['Vendor', 'Site', 'Date', 'Kind', 'Amount', 'Mode', 'Reference', 'Note'].join(','))
  for (const payment of state.vendorPayments) {
    lines.push(
      [
        vendorName(state, payment.vendorId),
        siteName(state, payment.siteId),
        formatDate(payment.date),
        payment.kind,
        payment.amount,
        payment.mode,
        payment.reference,
        payment.note,
      ]
        .map(csvCell)
        .join(','),
    )
  }
  return lines.join('\n')
}

export function downloadText(filename: string, contents: string, type: string): void {
  downloadBlob(filename, new Blob([contents], { type }))
}

export function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function stamp(): string {
  return toISODate(new Date())
}

function csvCell(value: string | number): string {
  const text = String(value ?? '')
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`
  return text
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Could not read a saved photo.'))
    reader.readAsDataURL(blob)
  })
}

function isAppState(value: unknown): value is AppState {
  if (!value || typeof value !== 'object') return false
  const state = value as AppState
  if (!Array.isArray(state.sites) || !Array.isArray(state.vendors)) return false
  if (!Array.isArray(state.ownerPayments) || !Array.isArray(state.materialBills)) return false
  if (!Array.isArray(state.labourContracts) || !Array.isArray(state.kharchi)) return false
  if (!Array.isArray(state.vendorPayments) || !Array.isArray(state.progress)) return false
  if (!state.settings || typeof state.settings.businessName !== 'string') return false
  return state.sites.every((site) => typeof site.id === 'string' && typeof site.name === 'string' && (site.contractType === 'fixed' || site.contractType === 'cost-plus'))
}

function normalizeState(state: AppState): AppState {
  return prepareState({
    ...state,
    version: 1,
    sampleBanner: Boolean(state.sampleBanner),
    settings: {
      businessName: state.settings.businessName || 'Sankalpa Constructions',
      tagline: state.settings.tagline || 'Material + labour turnkey',
      phone: state.settings.phone || '',
      address: state.settings.address || '',
    },
  })
}
