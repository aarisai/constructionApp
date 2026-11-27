import { ensureCovers } from './covers'
import type { AppState, MaterialRequest } from '../types'

export function prepareState(state: AppState): AppState {
  let changed = !Array.isArray(state.materialRequests)
  const progress = state.progress.map((update) => {
    if (typeof update.blockers === 'string') return update
    changed = true
    return { ...update, blockers: '' }
  })
  const materialRequests = Array.isArray(state.materialRequests)
    ? state.materialRequests.map((request) => normalizeRequest(request))
    : []
  if (Array.isArray(state.materialRequests)) {
    for (let index = 0; index < materialRequests.length; index += 1) {
      if (materialRequests[index] !== state.materialRequests[index]) changed = true
    }
  }
  const next = changed ? { ...state, progress, materialRequests } : state
  return ensureCovers(next)
}

function normalizeRequest(request: MaterialRequest): MaterialRequest {
  const whatsapp = String(request.whatsapp ?? '').replace(/\D/g, '')
  const note = request.note ?? ''
  const items = Array.isArray(request.items) ? request.items : []
  const lastSentAt = request.lastSentAt ?? null
  const vendorId = request.vendorId || null
  if (
    request.whatsapp === whatsapp &&
    request.note === note &&
    request.items === items &&
    request.lastSentAt === lastSentAt &&
    request.vendorId === vendorId
  ) {
    return request
  }
  return { ...request, whatsapp, note, items, lastSentAt, vendorId }
}
