import { STAGES, type Stage } from '../types'

export function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0)
}

export function rupees(value: number): number {
  return Math.round(value)
}

export function formatINR(value: number): string {
  const rounded = Math.round(value)
  const sign = rounded < 0 ? '-' : ''
  return `${sign}₹${Math.abs(rounded).toLocaleString('en-IN')}`
}

export function formatArea(area: number): string {
  return `${area.toLocaleString('en-IN', { maximumFractionDigits: 2 })} sq.ft`
}

export function formatQty(quantity: number, unit: string): string {
  return `${quantity.toLocaleString('en-IN', { maximumFractionDigits: 3 })} ${unit}`
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) return `${digits.slice(0, 5)} ${digits.slice(5)}`
  return phone
}

export function digitsOnly(phone: string): string {
  return phone.replace(/\D/g, '')
}

export function toISODate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseISODate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, (month ?? 1) - 1, day ?? 1)
}

export function isISODate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = parseISODate(value)
  return toISODate(date) === value
}

export function formatDate(iso: string): string {
  const [year, month, day] = iso.split('-')
  if (!year || !month || !day) return iso
  return `${day}/${month}/${year}`
}

export function addDays(iso: string, days: number): string {
  const date = parseISODate(iso)
  date.setDate(date.getDate() + days)
  return toISODate(date)
}

export function isoFromToday(days: number, now = new Date()): string {
  return addDays(toISODate(now), days)
}

export function daysFromToday(iso: string, now = new Date()): number {
  const today = parseISODate(toISODate(now))
  const target = parseISODate(iso)
  return Math.round((target.getTime() - today.getTime()) / 86_400_000)
}

export function lastSaturday(weeksBack: number, now = new Date()): string {
  const date = parseISODate(toISODate(now))
  const back = (date.getDay() + 1) % 7 + weeksBack * 7
  date.setDate(date.getDate() - back)
  return toISODate(date)
}

export function parseAmount(raw: string): number | null {
  const cleaned = raw.trim().replace(/[₹,\s]/g, '')
  if (!/^\d+(\.\d{0,2})?$/.test(cleaned)) return null
  const value = Number(cleaned)
  if (!Number.isFinite(value)) return null
  return Math.round(value)
}

export function parseQuantity(raw: string): number | null {
  const cleaned = raw.trim().replace(/,/g, '')
  if (!/^\d+(\.\d{0,3})?$/.test(cleaned)) return null
  const value = Number(cleaned)
  if (!Number.isFinite(value) || value <= 0) return null
  return value
}

export function parsePercent(raw: string): number | null {
  const cleaned = raw.trim()
  if (!/^\d+(\.\d{0,2})?$/.test(cleaned)) return null
  const value = Number(cleaned)
  if (!Number.isFinite(value) || value <= 0 || value > 100) return null
  return value
}

export function stageProgress(stage: Stage): number {
  const index = STAGES.indexOf(stage)
  if (index < 0) return 0
  return Math.round(((index + 1) / STAGES.length) * 100)
}

export function dueLabel(days: number): { text: string; tone: 'cash' | 'wait' | 'due' | 'neutral' } {
  if (days < 0) {
    const count = Math.abs(days)
    return { text: count === 1 ? 'Overdue by 1 day' : `Overdue by ${count} days`, tone: 'due' }
  }
  if (days === 0) return { text: 'Due today', tone: 'due' }
  if (days === 1) return { text: 'Due tomorrow', tone: 'wait' }
  if (days <= 7) return { text: `Due in ${days} days`, tone: 'wait' }
  return { text: '', tone: 'neutral' }
}
