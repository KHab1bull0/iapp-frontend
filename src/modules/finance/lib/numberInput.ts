/** "1234567.5" → "1 234 567.5": the whole part grouped, cents as typed. */
export function grouped(raw: string): string {
  const [whole, cents] = raw.split('.')
  const g = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return cents === undefined ? g : `${g}.${cents}`
}

/**
 * What was typed or pasted into an amount field, as plain digits (and, with
 * `cents`, one "." and at most two digits after it).
 *
 * So'm is whole: every separator is grouping ("1.500.000" → "1500000").
 * With cents: when both "." and "," appear, the last one is the cents point
 * ("1,234.56", "1.234,56"); a separator that appears more than once is
 * grouping ("1,500,000"); a single "," before exactly three digits is
 * grouping ("$1,500"); otherwise the single separator is the cents point
 * ("12,5", "12.505" → "12.50" as one types past the cents).
 */
export function cleanNumber(typed: string, cents: boolean, max = 12): string {
  const digits = (s: string) => s.replace(/\D/g, '')
  const whole = (s: string) => digits(s).replace(/^0+(?=\d)/, '').slice(0, max)
  const text = typed.replace(/[^\d.,]/g, '')
  if (!cents) {
    const w = whole(text)
    return w === '0' ? '' : w
  }

  const dots = text.split('.').length - 1
  const commas = text.split(',').length - 1
  let point = -1
  if (dots && commas) point = Math.max(text.lastIndexOf('.'), text.lastIndexOf(','))
  else if (dots === 1) point = text.indexOf('.')
  else if (commas === 1 && !/,\d{3}$/.test(text)) point = text.indexOf(',')

  if (point < 0) return whole(text)
  return `${whole(text.slice(0, point)) || '0'}.${digits(text.slice(point + 1)).slice(0, 2)}`
}
