import type {
  AppState,
  LabourContract,
  MaterialBill,
  Site,
} from '../types'
import { daysFromToday, dueLabel, sum } from './format'

export interface MilestoneRow {
  id: string
  name: string
  percent: number
  amount: number
  received: number
  pending: number
  state: 'cleared' | 'partial' | 'due'
}

export interface SiteMoney {
  billable: number
  ownerReceived: number
  ownerPending: number
  overpaid: number
  materialCost: number
  labourCost: number
  feeOrMargin: number
  payable: number
  cashIn: number
  cashOut: number
}

export interface DueBill {
  billId: string
  siteId: string
  siteName: string
  vendorId: string
  vendorName: string
  category: string
  pending: number
  dueDate: string
  days: number
  label: string
  tone: 'cash' | 'wait' | 'due' | 'neutral'
}

export interface DashboardSummary {
  ownerPending: number
  payablePending: number
  cashIn: number
  cashOut: number
  netCash: number
  advanceUnused: number
  dueSoon: DueBill[]
}

export interface VendorSiteSlice {
  siteId: string
  siteName: string
  pending: number
}

export interface VendorSummary {
  vendorId: string
  name: string
  kind: 'material' | 'labour'
  phone: string
  trade: string
  pending: number
  advance: number
  nextDue: string | null
  nextDays: number | null
  overdue: boolean
  sites: VendorSiteSlice[]
}

export interface CostLine {
  label: string
  amount: number
}

export function fixedContractValue(site: Site): number {
  if (site.fixedPricing === 'lump') return Math.round(site.lumpSumValue)
  return Math.round(site.ratePerSqFt * site.areaSqFt)
}

export function contractLabel(site: Site): string {
  if (site.contractType === 'cost-plus') return `Cost-plus ${site.feePercent}%`
  return site.fixedPricing === 'rate' ? 'Fixed rate' : 'Fixed lump sum'
}

export function siteMaterialCost(state: AppState, siteId: string): number {
  return sum(state.materialBills.filter((bill) => bill.siteId === siteId).map((bill) => bill.totalAmount))
}

export function siteLabourCost(state: AppState, siteId: string): number {
  return sum(state.labourContracts.filter((contract) => contract.siteId === siteId).map((contract) => contract.lumpSum))
}

export function ownerReceived(state: AppState, siteId: string): number {
  return sum(state.ownerPayments.filter((payment) => payment.siteId === siteId).map((payment) => payment.amount))
}

export function ownerBillable(state: AppState, site: Site): number {
  if (site.contractType === 'fixed') return fixedContractValue(site)
  const base = siteMaterialCost(state, site.id) + siteLabourCost(state, site.id)
  return Math.round(base + (base * site.feePercent) / 100)
}

export function billSettled(state: AppState, billId: string): number {
  return sum(
    state.vendorPayments
      .filter((payment) => payment.kind === 'bill' && payment.billId === billId)
      .map((payment) => payment.amount),
  )
}

export function billPending(state: AppState, bill: MaterialBill): number {
  return Math.max(0, bill.totalAmount - bill.paidNow - bill.advanceAdjusted - billSettled(state, bill.id))
}

export function contractKharchi(state: AppState, contractId: string): number {
  return sum(state.kharchi.filter((entry) => entry.contractId === contractId).map((entry) => entry.amount))
}

export function contractPayouts(state: AppState, contractId: string): number {
  return sum(
    state.vendorPayments
      .filter((payment) => payment.kind === 'labour' && payment.contractId === contractId)
      .map((payment) => payment.amount),
  )
}

export function contractRemaining(state: AppState, contract: LabourContract): number {
  return Math.max(0, contract.lumpSum - contractKharchi(state, contract.id) - contractPayouts(state, contract.id))
}

export function vendorAdvance(state: AppState, vendorId: string, exceptBillId?: string): number {
  const paid = sum(
    state.vendorPayments
      .filter((payment) => payment.vendorId === vendorId && payment.kind === 'advance')
      .map((payment) => payment.amount),
  )
  const used = sum(
    state.materialBills
      .filter((bill) => bill.vendorId === vendorId && bill.id !== exceptBillId)
      .map((bill) => bill.advanceAdjusted),
  )
  return paid - used
}

export function sitePayable(state: AppState, siteId: string): number {
  const bills = sum(
    state.materialBills.filter((bill) => bill.siteId === siteId).map((bill) => billPending(state, bill)),
  )
  const labour = sum(
    state.labourContracts
      .filter((contract) => contract.siteId === siteId)
      .map((contract) => contractRemaining(state, contract)),
  )
  return bills + labour
}

export function cashIn(state: AppState, siteId?: string): number {
  return sum(
    state.ownerPayments
      .filter((payment) => !siteId || payment.siteId === siteId)
      .map((payment) => payment.amount),
  )
}

/** Cash that has left the pocket. Advance adjusted on a bill is not counted again. */
export function cashOut(state: AppState, siteId?: string): number {
  const paidNow = sum(
    state.materialBills
      .filter((bill) => !siteId || bill.siteId === siteId)
      .map((bill) => bill.paidNow),
  )
  const later = sum(
    state.vendorPayments
      .filter((payment) => !siteId || payment.siteId === siteId)
      .map((payment) => payment.amount),
  )
  const kharchi = sum(
    state.kharchi.filter((entry) => !siteId || entry.siteId === siteId).map((entry) => entry.amount),
  )
  return paidNow + later + kharchi
}

export function siteMoney(state: AppState, site: Site): SiteMoney {
  const materialCost = siteMaterialCost(state, site.id)
  const labourCost = siteLabourCost(state, site.id)
  const billable = ownerBillable(state, site)
  const received = ownerReceived(state, site.id)
  const gap = billable - received
  const feeOrMargin =
    site.contractType === 'cost-plus'
      ? Math.round(((materialCost + labourCost) * site.feePercent) / 100)
      : billable - materialCost - labourCost
  return {
    billable,
    ownerReceived: received,
    ownerPending: Math.max(0, gap),
    overpaid: Math.max(0, -gap),
    materialCost,
    labourCost,
    feeOrMargin,
    payable: sitePayable(state, site.id),
    cashIn: cashIn(state, site.id),
    cashOut: cashOut(state, site.id),
  }
}

export function milestonePlan(site: Site, received: number): MilestoneRow[] {
  const total = fixedContractValue(site)
  const percentTotal = sum(site.milestones.map((milestone) => milestone.percent))
  const rows = site.milestones.map((milestone) => ({
    ...milestone,
    amount: Math.round((total * milestone.percent) / 100),
  }))
  if (rows.length > 0 && Math.abs(percentTotal - 100) < 0.2) {
    const allocated = sum(rows.map((row) => row.amount))
    rows[rows.length - 1].amount += total - allocated
  }
  let pool = Math.max(0, received)
  return rows.map((row) => {
    const amount = Math.max(0, row.amount)
    const applied = Math.min(amount, pool)
    pool -= applied
    const pending = amount - applied
    const state: MilestoneRow['state'] = pending <= 0 ? 'cleared' : applied > 0 ? 'partial' : 'due'
    return { id: row.id, name: row.name, percent: row.percent, amount, received: applied, pending, state }
  })
}

export function materialCategories(state: AppState, siteId: string): CostLine[] {
  const totals = new Map<string, number>()
  for (const bill of state.materialBills) {
    if (bill.siteId !== siteId) continue
    totals.set(bill.category, (totals.get(bill.category) ?? 0) + bill.totalAmount)
  }
  return [...totals.entries()].map(([label, amount]) => ({ label, amount })).sort((a, b) => b.amount - a.amount)
}

export function labourTrades(state: AppState, siteId: string): CostLine[] {
  const totals = new Map<string, number>()
  for (const contract of state.labourContracts) {
    if (contract.siteId !== siteId) continue
    totals.set(contract.trade, (totals.get(contract.trade) ?? 0) + contract.lumpSum)
  }
  return [...totals.entries()].map(([label, amount]) => ({ label, amount })).sort((a, b) => b.amount - a.amount)
}

export function openBills(state: AppState, vendorId?: string): Array<{ bill: MaterialBill; pending: number }> {
  return state.materialBills
    .filter((bill) => !vendorId || bill.vendorId === vendorId)
    .map((bill) => ({ bill, pending: billPending(state, bill) }))
    .filter((item) => item.pending > 0)
}

export function openContracts(state: AppState, vendorId?: string): Array<{ contract: LabourContract; remaining: number }> {
  return state.labourContracts
    .filter((contract) => !vendorId || contract.vendorId === vendorId)
    .map((contract) => ({ contract, remaining: contractRemaining(state, contract) }))
    .filter((item) => item.remaining > 0)
}

export function dueBills(state: AppState, now = new Date()): DueBill[] {
  const rows: DueBill[] = []
  for (const bill of state.materialBills) {
    const pending = billPending(state, bill)
    if (pending <= 0 || !bill.creditDueDate) continue
    const days = daysFromToday(bill.creditDueDate, now)
    const label = dueLabel(days)
    rows.push({
      billId: bill.id,
      siteId: bill.siteId,
      siteName: state.sites.find((site) => site.id === bill.siteId)?.name ?? 'Site',
      vendorId: bill.vendorId,
      vendorName: state.vendors.find((vendor) => vendor.id === bill.vendorId)?.name ?? 'Vendor',
      category: bill.category,
      pending,
      dueDate: bill.creditDueDate,
      days,
      label: label.text || 'Due later',
      tone: days <= 7 ? label.tone : 'neutral',
    })
  }
  return rows.sort((a, b) => a.dueDate.localeCompare(b.dueDate))
}

export function dashboardSummary(state: AppState, now = new Date()): DashboardSummary {
  const active = state.sites.filter((site) => site.active)
  const ownerPending = sum(active.map((site) => siteMoney(state, site).ownerPending))
  const payablePending = sum(active.map((site) => siteMoney(state, site).payable))
  const advanceUnused = sum(
    state.vendors.map((vendor) => Math.max(0, vendorAdvance(state, vendor.id))),
  )
  return {
    ownerPending,
    payablePending,
    cashIn: cashIn(state),
    cashOut: cashOut(state),
    netCash: cashIn(state) - cashOut(state),
    advanceUnused,
    dueSoon: dueBills(state, now).filter((bill) => bill.days <= 7),
  }
}

export function vendorSummaries(state: AppState, now = new Date()): VendorSummary[] {
  return state.vendors
    .map((vendor) => {
      const bills = state.materialBills.filter((bill) => bill.vendorId === vendor.id)
      const contracts = state.labourContracts.filter((contract) => contract.vendorId === vendor.id)
      const siteIds = new Set<string>([
        ...bills.map((bill) => bill.siteId),
        ...contracts.map((contract) => contract.siteId),
      ])
      const sites = [...siteIds].map((siteId) => {
        const pendingBills = sum(
          bills.filter((bill) => bill.siteId === siteId).map((bill) => billPending(state, bill)),
        )
        const pendingLabour = sum(
          contracts
            .filter((contract) => contract.siteId === siteId)
            .map((contract) => contractRemaining(state, contract)),
        )
        return {
          siteId,
          siteName: state.sites.find((site) => site.id === siteId)?.name ?? 'Site',
          pending: pendingBills + pendingLabour,
        }
      })
      const dues = dueBills(state, now).filter((bill) => bill.vendorId === vendor.id)
      const next = dues[0]
      return {
        vendorId: vendor.id,
        name: vendor.name,
        kind: vendor.kind,
        phone: vendor.phone,
        trade: vendor.trade,
        pending: sum(sites.map((site) => site.pending)),
        advance: vendorAdvance(state, vendor.id),
        nextDue: next?.dueDate ?? null,
        nextDays: next?.days ?? null,
        overdue: dues.some((bill) => bill.days < 0),
        sites: sites.sort((a, b) => b.pending - a.pending),
      }
    })
    .sort((a, b) => b.pending - a.pending || a.name.localeCompare(b.name))
}

export function siteName(state: AppState, siteId: string | null): string {
  if (!siteId) return 'No site'
  return state.sites.find((site) => site.id === siteId)?.name ?? 'Site'
}

export function vendorName(state: AppState, vendorId: string): string {
  return state.vendors.find((vendor) => vendor.id === vendorId)?.name ?? 'Vendor'
}
