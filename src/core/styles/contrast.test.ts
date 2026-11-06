/// <reference types="node" />
import { describe, expect, test } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve as resolvePath } from 'node:path'

// Read from disk: Vitest stubs out CSS imports, ?raw included.
const css = readFileSync(resolvePath(__dirname, 'index.css'), 'utf8')

/** The custom properties declared in the first block whose selector starts with `selector`. */
function block(selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`)
  if (start < 0) throw new Error(`no ${selector} block`)
  const body = css.slice(css.indexOf('{', start) + 1, css.indexOf('\n}', start))
  const vars: Record<string, string> = {}
  for (const m of body.matchAll(/(--[\w-]+):\s*([^;]+);/g)) vars[m[1]] = m[2].trim()
  return vars
}

const root = block(':root')

function resolve(theme: Record<string, string>, name: string): string {
  let value = theme[name] ?? root[name]
  for (let i = 0; value?.startsWith('var('); i++) {
    if (i > 5) throw new Error(`var loop at ${name}`)
    const ref = value.slice(4, -1).trim()
    value = theme[ref] ?? root[ref]
  }
  if (!value || !/^#[0-9a-f]{6}$/i.test(value)) throw new Error(`${name} is not a solid hex colour: ${value}`)
  return value
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

// Every text colour against every surface it is drawn on.
const TEXT_PAIRS: [fg: string, bg: string][] = [
  ['--fg', '--bg'],
  ['--fg', '--bg-elev'],
  ['--fg-muted', '--bg'],
  ['--fg-muted', '--bg-elev'],
  ['--primary-fg', '--primary'],
  ['--primary', '--bg-elev'],
  ['--danger', '--bg-elev'],
  ['--success', '--bg-elev'],
  ['--warning', '--bg-elev'],
]

describe.each([
  ['light', block('.theme-light, :root')],
  ['dark', block('.theme-dark')],
])('%s theme', (_name, theme) => {
  test.each(TEXT_PAIRS)('%s on %s meets WCAG AA (4.5:1)', (fg, bg) => {
    expect(contrast(resolve(theme, fg), resolve(theme, bg))).toBeGreaterThanOrEqual(4.5)
  })
})
