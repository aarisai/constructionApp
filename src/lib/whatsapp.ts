import { formatQty } from './format'
import type { RequirementItem } from '../types'

export function whatsappLink(phone: string, text: string): string | null {
  let digits = phone.replace(/\D/g, '')
  if (digits.startsWith('0')) digits = digits.slice(1)
  if (digits.length === 10) digits = `91${digits}`
  if (digits.length < 11 || digits.length > 15) return null
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
}

export function requirementMessage(input: {
  businessName: string
  siteName: string
  locality: string
  note: string
  items: RequirementItem[]
}): string {
  const lines = [
    input.businessName,
    `Material required for ${input.siteName}, ${input.locality}`,
    '',
    ...input.items.map((item, index) => {
      const detail = item.note.trim() ? ` (${item.note.trim()})` : ''
      return `${index + 1}. ${item.material} — ${formatQty(item.quantity, item.unit)}${detail}`
    }),
  ]
  if (input.note.trim()) lines.push('', input.note.trim())
  lines.push('', 'Please confirm the rate and when you can deliver.')
  return lines.join('\n')
}
