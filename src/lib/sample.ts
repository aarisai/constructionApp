import type {
  AppState,
  Kharchi,
  LabourContract,
  MaterialBill,
  MaterialRequest,
  OwnerPayment,
  ProgressUpdate,
  Vendor,
  VendorPayment,
} from '../types'
import { isoFromToday, lastSaturday } from './format'
import { standardMilestones, defaultSettings } from './presets'
import { SITE_COVERS } from './covers'

export const SAMPLE_SITE_IDS = ['site-jp', 'site-wf'] as const

export const SAMPLE_IMAGES = {
  jpFoundation: 'photo-jp-foundation',
  jpSlab: 'photo-jp-slab',
  jpBrick: 'photo-jp-brick',
  wfPit: 'photo-wf-pit',
  wfFooting: 'photo-wf-footing',
  wfSlab: 'photo-wf-slab',
  upi: 'photo-upi-jp',
  challan: 'photo-challan-jp',
} as const

function vendor(
  id: string,
  name: string,
  kind: Vendor['kind'],
  phone: string,
  trade: string,
): Vendor {
  return { id, name, kind, phone, trade, notes: '' }
}

export function createSampleState(now = new Date()): AppState {
  const day = (offset: number) => isoFromToday(offset, now)
  const saturday = (weeksBack: number) => lastSaturday(weeksBack, now)

  const vendors: Vendor[] = [
    vendor('vendor-maruthi', 'Maruthi Traders', 'material', '9845099001', 'Cement and blocks'),
    vendor('vendor-kaveri', 'Kaveri Steels', 'material', '9845099002', 'TMT steel'),
    vendor('vendor-slv', 'SLV Sand & Jelly', 'material', '9845099003', 'Sand and jelly'),
    vendor('vendor-rmc', 'Whitefield RMC', 'material', '9845099333', 'Ready-mix concrete'),
    vendor('vendor-manju', 'Manju Mestri', 'labour', '9845099111', 'Structure'),
    vendor('vendor-raju', 'Raju Centring Works', 'labour', '9845099222', 'Centring'),
    vendor('vendor-shankar', 'Shankar Mestri', 'labour', '9845099444', 'Structure'),
  ]

  const ownerPayments: OwnerPayment[] = [
    payment('owner-jp-1', 'site-jp', day(-155), 577700, 'UPI', '482911003821', 'Agreement advance', null),
    payment('owner-jp-2', 'site-jp', day(-120), 866550, 'NEFT/RTGS', 'HDFC982110045', 'Foundation stage', null),
    payment('owner-jp-3', 'site-jp', day(-90), 577700, 'Cheque', '004812', 'Plinth stage', null),
    payment('owner-jp-4', 'site-jp', day(-55), 866550, 'NEFT/RTGS', 'UTIB441290778', 'Ground slab', null),
    payment('owner-jp-5', 'site-jp', day(-18), 500000, 'UPI', '529100448213', 'Part of first slab', SAMPLE_IMAGES.upi),
    payment('owner-wf-1', 'site-wf', day(-78), 400000, 'NEFT/RTGS', 'ICIC22019811', 'Booking amount', null),
    payment('owner-wf-2', 'site-wf', day(-28), 250000, 'UPI', '618822190044', 'After footing concrete', null),
  ]

  const materialBills: MaterialBill[] = [
    bill('bill-jp-cement', 'site-jp', 'vendor-maruthi', day(-12), 'Cement', 200, 'bags', 76000, 40000, 0, day(3), 'UltraTech PPC for columns', SAMPLE_IMAGES.challan),
    bill('bill-jp-steel', 'site-jp', 'vendor-kaveri', day(-20), 'TMT Steel', 4.2, 'MT', 287700, 100000, 50000, day(10), '12mm and 8mm Fe550D', null),
    bill('bill-jp-sand', 'site-jp', 'vendor-slv', day(-8), 'M-Sand', 12, 'units', 38400, 38400, 0, null, 'Plastering sand held back', null),
    bill('bill-jp-jelly', 'site-jp', 'vendor-slv', day(-18), '20mm Jelly', 8, 'units', 22400, 0, 0, day(-3), 'For lintel concrete', null),
    bill('bill-jp-blocks', 'site-jp', 'vendor-maruthi', day(-6), 'Concrete Blocks', 2000, 'nos', 84000, 20000, 0, day(9), '6-inch blocks, ground floor', null),
    bill('bill-wf-cement', 'site-wf', 'vendor-maruthi', day(-30), 'Cement', 180, 'bags', 68400, 68400, 0, null, 'Footing and column cement', null),
    bill('bill-wf-steel', 'site-wf', 'vendor-kaveri', day(-25), 'TMT Steel', 6.5, 'MT', 436800, 200000, 0, day(5), 'Footing and slab steel', null),
    bill('bill-wf-sand', 'site-wf', 'vendor-slv', day(-22), 'M-Sand', 20, 'units', 68000, 68000, 0, null, '', null),
    bill('bill-wf-jelly', 'site-wf', 'vendor-slv', day(-22), '40mm Jelly', 10, 'units', 26000, 26000, 0, null, 'PCC and footing', null),
    bill('bill-wf-rmc', 'site-wf', 'vendor-rmc', day(-9), 'RMC', 18, 'cum', 111600, 50000, 0, day(6), 'Footing concrete, M25', null),
  ]

  const labourContracts: LabourContract[] = [
    {
      id: 'contract-manju',
      siteId: 'site-jp',
      vendorId: 'vendor-manju',
      trade: 'Structure — foundation to brickwork',
      lumpSum: 480000,
      date: day(-140),
      note: 'Lump sum till brickwork. Finishing trades are separate.',
    },
    {
      id: 'contract-raju',
      siteId: 'site-jp',
      vendorId: 'vendor-raju',
      trade: 'Slab centring and concrete',
      lumpSum: 160000,
      date: day(-70),
      note: 'Ground and first slab centring.',
    },
    {
      id: 'contract-shankar',
      siteId: 'site-wf',
      vendorId: 'vendor-shankar',
      trade: 'Excavation to ground slab',
      lumpSum: 320000,
      date: day(-75),
      note: 'Includes bar bending for footings and ground slab.',
    },
  ]

  const kharchi: Kharchi[] = [
    makeKharchi('kharchi-manju-2', 'site-jp', 'contract-manju', 'vendor-manju', saturday(1), 20000, 'Cash', '', 'Saturday kharchi'),
    makeKharchi('kharchi-manju-1', 'site-jp', 'contract-manju', 'vendor-manju', saturday(0), 25000, 'UPI', '4412901188', 'Saturday kharchi'),
    makeKharchi('kharchi-raju-1', 'site-jp', 'contract-raju', 'vendor-raju', saturday(2), 15000, 'Cash', '', 'Centring crew advance'),
    makeKharchi('kharchi-shankar-2', 'site-wf', 'contract-shankar', 'vendor-shankar', saturday(1), 25000, 'Cash', '', 'Saturday kharchi'),
    makeKharchi('kharchi-shankar-1', 'site-wf', 'contract-shankar', 'vendor-shankar', saturday(0), 30000, 'UPI', '7781203341', 'Saturday kharchi'),
  ]

  const vendorPayments: VendorPayment[] = [
    {
      id: 'advance-kaveri',
      vendorId: 'vendor-kaveri',
      siteId: 'site-jp',
      billId: null,
      contractId: null,
      date: day(-40),
      amount: 70000,
      mode: 'NEFT/RTGS',
      kind: 'advance',
      reference: 'SBIN883410',
      note: 'Steel advance before first-slab delivery',
      photoId: null,
    },
  ]

  const progress: ProgressUpdate[] = [
    progressRow('progress-jp-1', 'site-jp', day(-150), 'Excavation', 'Footing trenches excavated. Murum at about 5 feet.', []),
    progressRow('progress-jp-2', 'site-jp', day(-110), 'Foundation', 'Raft steel tied and cover blocks placed.', [SAMPLE_IMAGES.jpFoundation]),
    progressRow('progress-jp-3', 'site-jp', day(-70), 'Ground Slab', 'Ground floor slab cast. Curing started the same evening.', [SAMPLE_IMAGES.jpSlab]),
    progressRow(
      'progress-jp-4',
      'site-jp',
      day(-12),
      'Brickwork',
      'Ground floor 6-inch blockwork is up to lintel level.',
      [SAMPLE_IMAGES.jpBrick],
      'Block delivery was short by 400 nos, so the north wall waited two days.',
    ),
    progressRow('progress-wf-1', 'site-wf', day(-75), 'Excavation', 'Footing pits marked and excavated.', [SAMPLE_IMAGES.wfPit]),
    progressRow('progress-wf-2', 'site-wf', day(-40), 'Foundation', 'Footing concrete done. Column starters cast.', [SAMPLE_IMAGES.wfFooting]),
    progressRow('progress-wf-3', 'site-wf', day(-8), 'Ground Slab', 'Centring is up. Slab steel is about 60% tied.', [SAMPLE_IMAGES.wfSlab]),
  ]

  return {
    version: 1,
    sampleBanner: true,
    settings: defaultSettings(),
    sites: [
      {
        id: 'site-jp',
        name: 'Lakshmi Nilaya',
        locality: 'JP Nagar 7th Phase',
        plotSize: '30 × 40',
        areaSqFt: 2180,
        ownerName: 'Prakash Rao',
        ownerPhone: '9845012340',
        startDate: day(-160),
        stage: 'Brickwork',
        active: true,
        coverUrl: SITE_COVERS[0].src,
        contractType: 'fixed',
        fixedPricing: 'rate',
        ratePerSqFt: 2650,
        lumpSumValue: 0,
        milestones: standardMilestones(),
        feePercent: 12,
        createdAt: day(-160),
      },
      {
        id: 'site-wf',
        name: 'Oakridge Residence',
        locality: 'Whitefield',
        plotSize: '40 × 60',
        areaSqFt: 3450,
        ownerName: 'Meera Iyer',
        ownerPhone: '9886011122',
        startDate: day(-80),
        stage: 'Ground Slab',
        active: true,
        coverUrl: SITE_COVERS[1].src,
        contractType: 'cost-plus',
        fixedPricing: 'rate',
        ratePerSqFt: 0,
        lumpSumValue: 0,
        milestones: standardMilestones(),
        feePercent: 12,
        createdAt: day(-80),
      },
    ],
    vendors,
    ownerPayments,
    materialBills,
    labourContracts,
    kharchi,
    vendorPayments,
    progress,
    materialRequests: [sampleRequest(day)],
  }
}

export function emptyState(settings = defaultSettings()): AppState {
  return {
    version: 1,
    sampleBanner: false,
    settings,
    sites: [],
    vendors: [],
    ownerPayments: [],
    materialBills: [],
    labourContracts: [],
    kharchi: [],
    vendorPayments: [],
    progress: [],
    materialRequests: [],
  }
}

function payment(
  id: string,
  siteId: string,
  date: string,
  amount: number,
  mode: OwnerPayment['mode'],
  reference: string,
  note: string,
  photoId: string | null,
): OwnerPayment {
  return { id, siteId, date, amount, mode, reference, note, photoId }
}

function bill(
  id: string,
  siteId: string,
  vendorId: string,
  date: string,
  category: string,
  quantity: number,
  unit: string,
  totalAmount: number,
  paidNow: number,
  advanceAdjusted: number,
  creditDueDate: string | null,
  note: string,
  photoId: string | null,
): MaterialBill {
  return {
    id,
    siteId,
    vendorId,
    date,
    category,
    quantity,
    unit,
    totalAmount,
    paidNow,
    advanceAdjusted,
    creditDueDate,
    note,
    photoId,
  }
}

function makeKharchi(
  id: string,
  siteId: string,
  contractId: string,
  vendorId: string,
  date: string,
  amount: number,
  mode: Kharchi['mode'],
  reference: string,
  note: string,
): Kharchi {
  return { id, siteId, contractId, vendorId, date, amount, mode, reference, note, photoId: null }
}

function progressRow(
  id: string,
  siteId: string,
  date: string,
  stage: ProgressUpdate['stage'],
  note: string,
  photoIds: string[],
  blockers = '',
): ProgressUpdate {
  return { id, siteId, date, stage, note, blockers, photoIds }
}

function sampleRequest(day: (offset: number) => string): MaterialRequest {
  return {
    id: 'need-jp-1',
    siteId: 'site-jp',
    vendorId: 'vendor-maruthi',
    whatsapp: '9845099001',
    date: day(-2),
    note: 'Needed before the next column pour.',
    items: [
      { id: 'need-item-1', material: 'Cement', quantity: 150, unit: 'bags', note: 'UltraTech PPC' },
      { id: 'need-item-2', material: 'Concrete Blocks', quantity: 800, unit: 'nos', note: '6-inch' },
    ],
    createdAt: day(-2),
    lastSentAt: null,
  }
}
