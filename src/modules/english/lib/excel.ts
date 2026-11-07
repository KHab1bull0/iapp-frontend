import type { Workbook, Worksheet } from 'exceljs'
import type { ImportRow, Tag, TagGroup } from '@/modules/english/api/english'
import { shelve } from './tags'

/**
 * The Excel template for adding many words at once, and reading a filled-in
 * copy back. exceljs is loaded only when one of these runs (it is large), so
 * the Vocabulary page itself stays light.
 *
 * The columns' keys are plain English so a file made elsewhere (by hand or
 * by an AI from the prompt on the Instructions sheet) matches them easily.
 */
export const COLUMNS = [
  { key: 'word', required: true, max: 100, width: 18 },
  { key: 'description', required: false, max: 500, width: 42 },
  { key: 'example', required: false, max: 500, width: 42 },
  { key: 'translation', required: true, max: 200, width: 22 },
  { key: 'note', required: false, max: 1000, width: 34 },
  { key: 'tags', required: false, max: 300, width: 24 },
] as const

export type ColumnKey = (typeof COLUMNS)[number]['key']

/** Row 2 of the template: one filled-in word to copy. Left out when a file is read back. */
export const SAMPLE = {
  word: 'harvest',
  description: 'the time of year when crops are gathered from the fields',
  example: 'Farmers work from dawn to dusk during the harvest.',
  translation: "hosil, yig'im-terim",
  note: "Qishloq xo'jaligida ko'p ishlatiladi; fe'l sifatida: to harvest — yig'ib olmoq",
  tags: 'nature, noun',
} satisfies Record<ColumnKey, string>

/** A tag cell, "family, noun" (commas or semicolons), as names. */
export const splitTags = (cell: string) =>
  cell
    .split(/[,;]/)
    .map((x) => x.trim())
    .filter(Boolean)

/** One tag's name at most this long, at most this many on a word (as the server checks). */
const TAG_MAX = 50
const TAGS_PER_WORD = 20

export const MAX_ROWS = 1000

export const WORDS_SHEET = 'Words'
const TAGS_SHEET = 'Tags'
const GUIDE_SHEET = 'Guide'

export interface TemplateText {
  /** What each column holds, in the user's language. */
  columns: Record<ColumnKey, string>
  required: string
  optional: string
  guideTitle: string
  guideIntro: string[]
  column: string
  meaning: string
  sample: string
  limit: string
  tagName: string
  tagGroup: string
  tagId: string
  noTags: string
  aiTitle: string
  aiPrompt: (groups: { name: string; tags: string[] }[]) => string
}

async function excel() {
  return (await import('exceljs')).default
}

/**
 * exceljs finds a sheet's comments only under its own file names
 * (xl/comments1.xml, xl/drawings/vmlDrawing1.vml). Files written by openpyxl
 * (Python: what ChatGPT and most scripts use) keep them elsewhere
 * (xl/comments/comment1.xml, absolute links), and exceljs then fails on the
 * whole file. The import needs only the cells, so the sheets' links to their
 * comments are dropped before exceljs reads the file.
 */
export async function normalizeXlsx(data: ArrayBuffer): Promise<ArrayBuffer> {
  const JSZip = (await import('jszip')).default
  // A Uint8Array view: JSZip checks types with instanceof, which a buffer from
  // another realm (a test's jsdom) fails.
  const zip = await JSZip.loadAsync(new Uint8Array(data))
  let changed = false
  const rels = Object.keys(zip.files).filter((name) => /^xl\/worksheets\/_rels\/[^/]+\.rels$/.test(name))
  for (const name of rels) {
    const xml = await zip.file(name)!.async('string')
    const fixed = xml.replace(/<Relationship\b[^>]*\/relationships\/(?:comments|vmlDrawing)"[^>]*\/>/g, '')
    if (fixed !== xml) {
      zip.file(name, fixed)
      changed = true
    }
  }
  return changed ? zip.generateAsync({ type: 'arraybuffer' }) : data
}

/**
 * The template as a downloadable file: the words sheet, the user's tags (by
 * group), and a guide. `groupName` shows a group's name in the user's language.
 */
export async function buildTemplate(
  tags: Pick<Tag, 'id' | 'name' | 'groupId'>[],
  groups: TagGroup[],
  text: TemplateText,
  groupName: (g: TagGroup | null) => string,
): Promise<Blob> {
  const ExcelJS = await excel()
  const wb: Workbook = new ExcelJS.Workbook()
  wb.creator = 'IAPP'

  // ── Words ──
  const words = wb.addWorksheet(WORDS_SHEET, { views: [{ state: 'frozen', ySplit: 1 }] })
  words.columns = COLUMNS.map((c) => ({ header: c.key, key: c.key, width: c.width }))
  const head = words.getRow(1)
  head.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  head.height = 22
  COLUMNS.forEach((c, i) => {
    const cell = head.getCell(i + 1)
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: c.required ? 'FF15803D' : 'FF475569' } }
    cell.alignment = { vertical: 'middle' }
    cell.note = `${text.columns[c.key]} (${c.required ? text.required : text.optional}, ≤ ${c.max})`
  })
  const sample = words.addRow(SAMPLE)
  sample.font = { italic: true, color: { argb: 'FF64748B' } }
  sample.getCell(1).note = text.sample

  // ── Tags ── (a word takes several, so the column is typed, not picked: this sheet is the list)
  const shelves = shelve(tags, groups)
  const list = wb.addWorksheet(TAGS_SHEET)
  list.columns = [
    { header: text.tagName, key: 'name', width: 24 },
    { header: text.tagGroup, key: 'group', width: 24 },
    { header: text.tagId, key: 'id', width: 40 },
  ]
  list.getRow(1).font = { bold: true }
  if (tags.length === 0) list.addRow({ name: text.noTags })
  for (const shelf of shelves) {
    for (const tag of shelf.tags) list.addRow({ name: tag.name, group: groupName(shelf.group), id: tag.id })
  }

  // ── Guide ──
  const guide = wb.addWorksheet(GUIDE_SHEET)
  guide.columns = [
    { key: 'a', width: 16 },
    { key: 'b', width: 12 },
    { key: 'c', width: 50 },
    { key: 'd', width: 50 },
    { key: 'e', width: 8 },
  ]
  guide.addRow([text.guideTitle]).font = { bold: true, size: 14 }
  for (const line of text.guideIntro) guide.addRow([line])
  guide.addRow([])
  guide.addRow([text.column, '', text.meaning, text.sample, text.limit]).font = { bold: true }
  for (const c of COLUMNS) {
    guide.addRow([
      c.key,
      c.required ? text.required : text.optional,
      text.columns[c.key],
      SAMPLE[c.key],
      c.max,
    ])
  }
  guide.addRow([])
  guide.addRow([text.aiTitle]).font = { bold: true }
  const prompt = guide.addRow([
    text.aiPrompt(shelves.map((sh) => ({ name: groupName(sh.group), tags: sh.tags.map((tg) => tg.name) }))),
  ])
  guide.mergeCells(prompt.number, 1, prompt.number, 4)
  prompt.alignment = { wrapText: true, vertical: 'top' }
  prompt.height = 220
  guide.getColumn(3).alignment = { wrapText: true, vertical: 'top' }
  guide.getColumn(4).alignment = { wrapText: true, vertical: 'top' }

  const buffer = await wb.xlsx.writeBuffer()
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}

/** A row read from the file, numbered as Excel shows it, with what is wrong with it if anything. */
export interface ParsedRow {
  line: number
  row: ImportRow
  problems: ('missingWord' | 'missingTranslation' | 'tooLong')[]
}

export type ParseResult =
  | { ok: true; rows: ParsedRow[] }
  | { ok: false; error: 'unreadable' | 'noHeader' | 'tooMany' }

const cellText = (ws: Worksheet, r: number, c: number) => ws.getRow(r).getCell(c).text?.trim() ?? ''

/** Reads a filled-in template (or any sheet whose first row has the column keys). */
export async function parseWorkbook(file: Blob): Promise<ParseResult> {
  const ExcelJS = await excel()
  const wb = new ExcelJS.Workbook()
  try {
    await wb.xlsx.load(await normalizeXlsx(await file.arrayBuffer()))
  } catch {
    return { ok: false, error: 'unreadable' }
  }
  const ws = wb.getWorksheet(WORDS_SHEET) ?? wb.worksheets[0]
  if (!ws) return { ok: false, error: 'noHeader' }

  // Columns by their header, wherever they are; any case, extra spaces ignored.
  const at = new Map<ColumnKey, number>()
  ws.getRow(1).eachCell((cell, col) => {
    const raw = cell.text?.trim().toLowerCase()
    // The template's column before tags was "category": its value is read as a tag.
    const key = raw === 'category' ? 'tags' : raw
    const known = COLUMNS.find((c) => c.key === key)
    if (known && !at.has(known.key)) at.set(known.key, col)
  })
  if (!at.has('word') || !at.has('translation')) return { ok: false, error: 'noHeader' }

  const rows: ParsedRow[] = []
  for (let r = 2; r <= ws.rowCount; r++) {
    const get = (key: ColumnKey) => {
      const col = at.get(key)
      return col ? cellText(ws, r, col) : ''
    }
    const cells = Object.fromEntries(COLUMNS.map((c) => [c.key, get(c.key)])) as Record<ColumnKey, string>
    if (COLUMNS.every((c) => !cells[c.key])) continue // an empty line
    if (cells.word === SAMPLE.word && cells.translation === SAMPLE.translation) continue // the template's sample
    const tags = splitTags(cells.tags)
    const row: ImportRow = {
      word: cells.word,
      translation: cells.translation,
      description: cells.description,
      example: cells.example,
      note: cells.note,
      tags,
    }
    const problems: ParsedRow['problems'] = []
    if (!row.word) problems.push('missingWord')
    if (!row.translation) problems.push('missingTranslation')
    if (
      COLUMNS.some((c) => cells[c.key].length > c.max) ||
      tags.length > TAGS_PER_WORD ||
      tags.some((tg) => tg.length > TAG_MAX)
    ) {
      problems.push('tooLong')
    }
    rows.push({ line: r, row, problems })
  }
  if (rows.length > MAX_ROWS) return { ok: false, error: 'tooMany' }
  return { ok: true, rows }
}

/** Hands the browser a file to save. */
export function saveFile(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.append(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
