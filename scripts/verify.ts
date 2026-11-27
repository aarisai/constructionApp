import assert from 'node:assert/strict'
import {
  billPending,
  contractRemaining,
  dashboardSummary,
  milestonePlan,
  siteMoney,
  vendorAdvance,
} from '../src/lib/calc.ts'
import { paceNotes } from '../src/lib/pace.ts'
import { parseHash, toHash, type Route } from '../src/lib/routes.ts'
import { createSampleState } from '../src/lib/sample.ts'
import { requirementMessage, whatsappLink } from '../src/lib/whatsapp.ts'

const now = new Date(2026, 10, 26)
const state = createSampleState(now)
const summary = dashboardSummary(state, now)
const jp = state.sites.find((site) => site.id === 'site-jp')
const wf = state.sites.find((site) => site.id === 'site-wf')
assert.ok(jp && wf)

const jpMoney = siteMoney(state, jp)
const wfMoney = siteMoney(state, wf)

assert.equal(jpMoney.billable, 5_777_000)
assert.equal(jpMoney.ownerReceived, 3_388_500)
assert.equal(jpMoney.ownerPending, 2_388_500)
assert.equal(jpMoney.materialCost, 508_500)
assert.equal(jpMoney.labourCost, 640_000)
assert.equal(jpMoney.payable, 840_100)
assert.equal(jpMoney.cashOut, 328_400)

assert.equal(wfMoney.materialCost, 710_800)
assert.equal(wfMoney.labourCost, 320_000)
assert.equal(wfMoney.feeOrMargin, 123_696)
assert.equal(wfMoney.billable, 1_154_496)
assert.equal(wfMoney.ownerPending, 504_496)
assert.equal(wfMoney.payable, 563_400)
assert.equal(wfMoney.cashOut, 467_400)

assert.equal(summary.ownerPending, 2_892_996)
assert.equal(summary.payablePending, 1_403_500)
assert.equal(summary.cashIn, 4_038_500)
assert.equal(summary.cashOut, 795_800)
assert.equal(summary.netCash, 3_242_700)
assert.equal(summary.advanceUnused, 20_000)
assert.equal(summary.dueSoon.length, 4)

const dueIds = summary.dueSoon.map((item) => item.billId).sort()
assert.deepEqual(dueIds, ['bill-jp-cement', 'bill-jp-jelly', 'bill-wf-rmc', 'bill-wf-steel'])
assert.equal(summary.dueSoon.find((item) => item.billId === 'bill-jp-jelly')?.days, -3)
assert.equal(summary.dueSoon.find((item) => item.billId === 'bill-jp-cement')?.days, 3)

const steel = state.materialBills.find((bill) => bill.id === 'bill-jp-steel')
assert.ok(steel)
assert.equal(billPending(state, steel), 137_700)
assert.equal(vendorAdvance(state, 'vendor-kaveri'), 20_000)

const manju = state.labourContracts.find((contract) => contract.id === 'contract-manju')
assert.ok(manju)
assert.equal(contractRemaining(state, manju), 435_000)

const plan = milestonePlan(jp, jpMoney.ownerReceived)
assert.equal(plan[0]?.state, 'cleared')
assert.equal(plan[3]?.state, 'cleared')
assert.equal(plan[4]?.state, 'partial')
assert.equal(plan[4]?.received, 500_000)
assert.equal(plan[4]?.pending, 366_550)
assert.equal(plan[5]?.state, 'due')
assert.equal(plan.reduce((total, row) => total + row.amount, 0), jpMoney.billable)

const copy = structuredClone(state)
copy.vendorPayments.push({
  id: 'test-pay',
  vendorId: 'vendor-manju',
  siteId: 'site-jp',
  billId: null,
  contractId: 'contract-manju',
  date: '2026-11-20',
  amount: 10_000,
  mode: 'Cash',
  kind: 'labour',
  reference: '',
  note: '',
  photoId: null,
})
const manjuCopy = copy.labourContracts.find((contract) => contract.id === 'contract-manju')
assert.ok(manjuCopy)
assert.equal(contractRemaining(copy, manjuCopy), 425_000)

const routes: Route[] = [
  { name: 'home' },
  { name: 'sites' },
  { name: 'site-new' },
  { name: 'site', id: 'site-jp', tab: 'labour' },
  { name: 'site-edit', id: 'site wf/1' },
  { name: 'vendors' },
  { name: 'vendor', id: 'vendor-kaveri' },
  { name: 'reports' },
  { name: 'owner-report', id: 'site-wf' },
]
for (const route of routes) {
  assert.deepEqual(parseHash(toHash(route)), route)
}
assert.deepEqual(parseHash('#/sites/site-jp'), { name: 'site', id: 'site-jp', tab: 'owner' })
assert.deepEqual(parseHash('#/sites/site-jp/needs'), { name: 'site', id: 'site-jp', tab: 'needs' })
assert.deepEqual(parseHash(''), { name: 'home' })

const request = state.materialRequests.find((item) => item.id === 'need-jp-1')
assert.ok(request)
const link = whatsappLink(
  request.whatsapp,
  requirementMessage({
    businessName: state.settings.businessName,
    siteName: jp.name,
    locality: jp.locality,
    note: request.note,
    items: request.items,
  }),
)
assert.ok(link?.startsWith('https://wa.me/919845099001?text='))
assert.ok(paceNotes(state.progress.filter((item) => item.siteId === 'site-jp'), jp, now).length > 0)

console.log('Sample books and routes check out.')
console.log(
  `Owners owe ${summary.ownerPending.toLocaleString('en-IN')}, payables ${summary.payablePending.toLocaleString('en-IN')}, net cash ${summary.netCash.toLocaleString('en-IN')}.`,
)
