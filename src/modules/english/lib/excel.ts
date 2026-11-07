import type { Workbook, Worksheet } from 'exceljs'
import type { Category, ImportRow } from '@/modules/english/api/english'

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
  { key: 'category', required: false, max: 50, width: 18 },
] as const

export type ColumnKey = (typeof COLUMNS)[number]['key']

/** Row 2 of the template: one filled-in word to copy. Left out when a file is read back. */
export const SAMPLE: Required<ImportRow> = {
  word: 'harvest',
  description: 'the time of year when crops are gathered from the fields',
  example: 'Farmers work from dawn to dusk during the harvest.',
  translation: "hosil, yig'im-terim",
  note: "Qishloq xo'jaligida ko'p ishlatiladi; fe'l sifatida: to harvest — yig'ib olmoq",
  category: '',
}

export const MAX_ROWS = 1000

export const WORDS_SHEET = 'Words'
const CATEGORIES_SHEET = 'Categories'
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
  categoriesTitle: string
  categoryName: string
  categoryId: string
  noCategories: string
  aiTitle: string
  aiPrompt: (categories: string[]) => string
}

async function excel() {
  return (await import('exceljs')).default
}

/** The template as a downloadable file: the words sheet, the user's categories, and a guide. */
export async function buildTemplate(categories: Category[], text: TemplateText): Promise<Blob> {
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
  const sample = words.addRow({ ...SAMPLE, category: categories[0]?.name ?? '' })
  sample.font = { italic: true, color: { argb: 'FF64748B' } }
  sample.getCell(1).note = text.sample

  // The category column offers the user's categories as a list. A name that
  // is not on it only warns: the import can create it.
  if (categories.length > 0) {
    const col = COLUMNS.findIndex((c) => c.key === 'category') + 1
    for (let r = 2; r <= MAX_ROWS + 1; r++) {
      words.getCell(r, col).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`'${CATEGORIES_SHEET}'!$A$2:$A$${categories.length + 1}`],
        showErrorMessage: true,
        errorStyle: 'warning',
      }
    }
  }

  // ── Categories ──
  const cats = wb.addWorksheet(CATEGORIES_SHEET)
  cats.columns = [
    { header: text.categoryName, key: 'name', width: 28 },
    { header: text.categoryId, key: 'id', width: 40 },
  ]
  cats.getRow(1).font = { bold: true }
  if (categories.length === 0) cats.addRow({ name: text.noCategories })
  for (const c of categories) cats.addRow({ name: c.name, id: c.id })

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
      c.key === 'category' ? (categories[0]?.name ?? '') : SAMPLE[c.key],
      c.max,
    ])
  }
  guide.addRow([])
  guide.addRow([text.aiTitle]).font = { bold: true }
  const prompt = guide.addRow([text.aiPrompt(categories.map((c) => c.name))])
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
    await wb.xlsx.load(await file.arrayBuffer())
  } catch {
    return { ok: false, error: 'unreadable' }
  }
  const ws = wb.getWorksheet(WORDS_SHEET) ?? wb.worksheets[0]
  if (!ws) return { ok: false, error: 'noHeader' }

  // Columns by their header, wherever they are; any case, extra spaces ignored.
  const at = new Map<ColumnKey, number>()
  ws.getRow(1).eachCell((cell, col) => {
    const key = cell.text?.trim().toLowerCase()
    const known = COLUMNS.find((c) => c.key === key)
    if (known) at.set(known.key, col)
  })
  if (!at.has('word') || !at.has('translation')) return { ok: false, error: 'noHeader' }

  const rows: ParsedRow[] = []
  for (let r = 2; r <= ws.rowCount; r++) {
    const get = (key: ColumnKey) => {
      const col = at.get(key)
      return col ? cellText(ws, r, col) : ''
    }
    const row: ImportRow = {
      word: get('word'),
      translation: get('translation'),
      description: get('description'),
      example: get('example'),
      note: get('note'),
      category: get('category'),
    }
    if (COLUMNS.every((c) => !row[c.key])) continue // an empty line
    if (row.word === SAMPLE.word && row.translation === SAMPLE.translation) continue // the template's sample
    const problems: ParsedRow['problems'] = []
    if (!row.word) problems.push('missingWord')
    if (!row.translation) problems.push('missingTranslation')
    if (COLUMNS.some((c) => (row[c.key]?.length ?? 0) > c.max)) problems.push('tooLong')
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
