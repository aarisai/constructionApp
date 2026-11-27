export const STAGES = [
  'Excavation',
  'Foundation',
  'Plinth',
  'Ground Slab',
  '1st Slab',
  '2nd Slab',
  'Brickwork',
  'Plastering',
  'Flooring',
  'Finishing',
  'Handover',
] as const

export type Stage = (typeof STAGES)[number]

export const PAYMENT_MODES = ['UPI', 'NEFT/RTGS', 'Cheque', 'Cash'] as const
export type PaymentMode = (typeof PAYMENT_MODES)[number]

export const MATERIAL_CATEGORIES = [
  'Cement',
  'TMT Steel',
  'M-Sand',
  'P-Sand',
  '20mm Jelly',
  '40mm Jelly',
  'Concrete Blocks',
  'Bricks',
  'RMC',
  'Electrical',
  'Plumbing',
  'Tiles',
  'Paint',
  'Hardware',
  'Other',
] as const

export const UNITS = [
  'bags',
  'MT',
  'tonnes',
  'units',
  'nos',
  'loads',
  'cum',
  'cft',
  'sq.ft',
  'rft',
  'kg',
  'litres',
  'trip',
] as const

export const LOCALITIES = [
  'JP Nagar 7th Phase',
  'Jayanagar',
  'Banashankari',
  'Basavanagudi',
  'Whitefield',
  'Varthur',
  'Sarjapur Road',
  'Electronic City',
  'HSR Layout',
  'Koramangala',
  'Hebbal',
  'Yelahanka',
  'Nagarbhavi',
  'RR Nagar',
  'Kengeri',
  'Yeshwanthpur',
  'Vijayanagar',
  'Kanakapura Road',
  'Bannerghatta Road',
  'Marathahalli',
  'Krishnarajapuram',
] as const

export type ContractType = 'fixed' | 'cost-plus'
export type FixedPricing = 'rate' | 'lump'
export type VendorKind = 'material' | 'labour'
export type PaymentKind = 'bill' | 'labour' | 'advance'

export interface Milestone {
  id: string
  name: string
  percent: number
}

export interface Settings {
  businessName: string
  tagline: string
  phone: string
  address: string
}

export interface Site {
  id: string
  name: string
  locality: string
  plotSize: string
  areaSqFt: number
  ownerName: string
  ownerPhone: string
  startDate: string
  stage: Stage
  active: boolean
  coverUrl: string
  contractType: ContractType
  fixedPricing: FixedPricing
  ratePerSqFt: number
  lumpSumValue: number
  milestones: Milestone[]
  feePercent: number
  createdAt: string
}

export interface Vendor {
  id: string
  name: string
  kind: VendorKind
  phone: string
  trade: string
  notes: string
}

export interface OwnerPayment {
  id: string
  siteId: string
  date: string
  amount: number
  mode: PaymentMode
  reference: string
  note: string
  photoId: string | null
}

export interface MaterialBill {
  id: string
  siteId: string
  vendorId: string
  date: string
  category: string
  quantity: number
  unit: string
  totalAmount: number
  paidNow: number
  advanceAdjusted: number
  creditDueDate: string | null
  note: string
  photoId: string | null
}

export interface LabourContract {
  id: string
  siteId: string
  vendorId: string
  trade: string
  lumpSum: number
  date: string
  note: string
}

export interface Kharchi {
  id: string
  siteId: string
  contractId: string
  vendorId: string
  date: string
  amount: number
  mode: PaymentMode
  reference: string
  note: string
  photoId: string | null
}

export interface VendorPayment {
  id: string
  vendorId: string
  siteId: string | null
  billId: string | null
  contractId: string | null
  date: string
  amount: number
  mode: PaymentMode
  kind: PaymentKind
  reference: string
  note: string
  photoId: string | null
}

export interface ProgressUpdate {
  id: string
  siteId: string
  date: string
  stage: Stage
  note: string
  blockers: string
  photoIds: string[]
}

export interface RequirementItem {
  id: string
  material: string
  quantity: number
  unit: string
  note: string
}

export interface MaterialRequest {
  id: string
  siteId: string
  vendorId: string | null
  whatsapp: string
  date: string
  note: string
  items: RequirementItem[]
  createdAt: string
  lastSentAt: string | null
}

export interface AppState {
  version: 1
  sampleBanner: boolean
  settings: Settings
  sites: Site[]
  vendors: Vendor[]
  ownerPayments: OwnerPayment[]
  materialBills: MaterialBill[]
  labourContracts: LabourContract[]
  kharchi: Kharchi[]
  vendorPayments: VendorPayment[]
  progress: ProgressUpdate[]
  materialRequests: MaterialRequest[]
}

export interface NewVendorInput {
  name: string
  phone: string
  kind: VendorKind
  trade: string
}
