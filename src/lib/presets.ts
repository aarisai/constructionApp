import type { Milestone, Settings } from '../types'
import { uid } from './id'

export const STANDARD_MILESTONES: Array<[string, number]> = [
  ['Agreement advance', 10],
  ['Foundation', 15],
  ['Plinth', 10],
  ['Ground slab', 15],
  ['First slab', 15],
  ['Brickwork', 10],
  ['Plastering', 10],
  ['Flooring', 8],
  ['Finishing', 5],
  ['Handover', 2],
]

export function standardMilestones(): Milestone[] {
  return STANDARD_MILESTONES.map(([name, percent]) => ({ id: uid(), name, percent }))
}

export function defaultSettings(): Settings {
  return {
    businessName: 'Sankalpa Constructions',
    tagline: 'Material + labour turnkey',
    phone: '9845022018',
    address: '214, 24th Main, JP Nagar 6th Phase, Bengaluru 560078',
  }
}
