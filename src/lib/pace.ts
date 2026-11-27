import { daysFromToday, formatDate, parseISODate, toISODate } from './format'
import type { ProgressUpdate, Site } from '../types'

export interface PaceNote {
  title: string
  body: string
}

export function paceNotes(updates: ProgressUpdate[], site: Site, now = new Date()): PaceNote[] {
  const notes: PaceNote[] = []
  const sorted = updates.slice().sort((a, b) => a.date.localeCompare(b.date))
  if (sorted.length === 0) {
    return [
      {
        title: 'No weekly record yet',
        body: 'Log this week’s work with a photo. Over time you can see which stage took the longest.',
      },
    ]
  }

  for (let index = 1; index < sorted.length; index += 1) {
    const previous = sorted[index - 1]
    const next = sorted[index]
    const gap = daysBetween(previous.date, next.date)
    if (gap >= 14) {
      notes.push({
        title: `${gap} days with no update`,
        body: `Nothing was logged between ${formatDate(previous.date)} and ${formatDate(next.date)}. A photo each week shows a stall while you can still chase material or add crew.`,
      })
    }
  }

  const latest = sorted[sorted.length - 1]
  const sinceLatest = Math.abs(daysFromToday(latest.date, now))
  if (daysFromToday(latest.date, now) <= -7) {
    notes.push({
      title: 'This week is not logged',
      body: `The last update was ${formatDate(latest.date)}, ${sinceLatest} days ago. Add this week’s pictures before the details fade.`,
    })
  }

  const spans = stageSpans(sorted)
  let longest: { stage: string; days: number } | null = null
  for (const span of spans) {
    const end = span === spans[spans.length - 1] ? toISODate(now) : span.end
    const days = daysBetween(span.start, end)
    if (!longest || days > longest.days) longest = { stage: span.stage, days }
  }
  if (longest && longest.days >= 21) {
    const stillOpen = spans[spans.length - 1]?.stage === site.stage
    notes.push({
      title: stillOpen ? `${longest.stage} is the long stage` : `${longest.stage} took the longest`,
      body: `${longest.days} days on ${longest.stage}. Next time, place the material order and book the next crew before this stage starts.`,
    })
  }

  const missingPhotos = sorted.filter((update) => update.photoIds.length === 0).length
  if (missingPhotos > 0) {
    notes.push({
      title: missingPhotos === 1 ? 'One week has no picture' : `${missingPhotos} weeks have no picture`,
      body: 'Photograph the same corner each week. The sequence is easier to compare than a note alone.',
    })
  }

  for (const update of sorted.filter((item) => item.blockers.trim()).slice(-2)) {
    notes.push({
      title: `Slowdown on ${formatDate(update.date)}`,
      body: update.blockers.trim(),
    })
  }

  if (notes.length === 0) {
    notes.push({
      title: 'The weekly record is close together',
      body: 'No long gap so far. Keep one photo set each week so the next stall shows up early.',
    })
  }
  return notes.slice(0, 6)
}

function stageSpans(updates: ProgressUpdate[]): Array<{ stage: string; start: string; end: string }> {
  const spans: Array<{ stage: string; start: string; end: string }> = []
  for (const update of updates) {
    const current = spans[spans.length - 1]
    if (current && current.stage === update.stage) current.end = update.date
    else spans.push({ stage: update.stage, start: update.date, end: update.date })
  }
  return spans
}

function daysBetween(earlier: string, later: string): number {
  const start = parseISODate(earlier).getTime()
  const end = parseISODate(later).getTime()
  return Math.max(0, Math.round((end - start) / 86_400_000))
}
