import { describe, expect, test } from 'vitest'
import ExcelJS from 'exceljs'
import JSZip from 'jszip'
import { englishMessages } from '@/modules/english/i18n'
import { category } from '@/modules/english/test-data'
import { buildTemplate, COLUMNS, parseWorkbook, SAMPLE, WORDS_SHEET } from './excel'

const text = englishMessages.uz.imp.template

async function sheet(rows: (string | undefined)[][]): Promise<Blob> {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Sheet1')
  for (const r of rows) ws.addRow(r)
  return new Blob([await wb.xlsx.writeBuffer()])
}

describe('Excel template', () => {
  test('has the columns, a sample row, the categories with a pick list, and a guide', async () => {
    const blob = await buildTemplate([category('c1', 'Travel'), category('c2', 'Work')], text)
    const wb = new ExcelJS.Workbook()
    await wb.xlsx.load(await blob.arrayBuffer())
    const words = wb.getWorksheet(WORDS_SHEET)!
    expect(words.getRow(1).values).toEqual([undefined, ...COLUMNS.map((c) => c.key)])
    expect(words.getRow(2).getCell(1).text).toBe(SAMPLE.word)
    expect(words.getRow(2).getCell(6).text).toBe('Travel')
    expect(words.getCell('F3').dataValidation).toMatchObject({ type: 'list', formulae: ["'Categories'!$A$2:$A$3"] })
    const cats = wb.getWorksheet('Categories')!
    expect([cats.getCell('A2').text, cats.getCell('B2').text]).toEqual(['Travel', 'c1'])
    const guide = wb.getWorksheet('Guide')!
    const all = guide.getSheetValues().flat().join(' ')
    // The AI prompt names the user's categories.
    expect(all).toContain('faqat shulardan biri: Travel, Work')
  })

  test('read back untouched, it has no words: the sample is left out', async () => {
    const parsed = await parseWorkbook(await buildTemplate([], text))
    expect(parsed).toEqual({ ok: true, rows: [] })
  })
})

describe('reading a filled-in file', () => {
  test('finds the columns by header in any order or case, skips empty lines, flags bad rows', async () => {
    const parsed = await parseWorkbook(
      await sheet([
        ['Translation', 'WORD', 'description', 'category'],
        ['muddat', 'deadline', 'the latest time to finish', 'Work'],
        [],
        ['', 'lonely'],
        ['maosh', 'x'.repeat(101)],
      ]),
    )
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.rows.map((r) => [r.line, r.row.word.slice(0, 8), r.problems])).toEqual([
      [2, 'deadline', []],
      [4, 'lonely', ['missingTranslation']],
      [5, 'xxxxxxxx', ['tooLong']],
    ])
    expect(parsed.rows[0].row).toMatchObject({ translation: 'muddat', description: 'the latest time to finish', category: 'Work' })
  })

  test("says so when the header lacks 'word' or 'translation', or the file isn't Excel", async () => {
    expect(await parseWorkbook(await sheet([['word', 'meaning'], ['a', 'b']]))).toEqual({ ok: false, error: 'noHeader' })
    expect(await parseWorkbook(new Blob(['not a spreadsheet']))).toEqual({ ok: false, error: 'unreadable' })
  })
})

describe('files from other tools', () => {
  /** Lays out a sheet's comments the way openpyxl (Python) writes them. */
  async function openpyxlStyle(): Promise<Blob> {
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('Words')
    ws.addRow(['word', 'translation'])
    ws.addRow(['shelter', 'boshpana'])
    ws.getCell('A1').note = 'The English word'
    const zip = await JSZip.loadAsync(new Uint8Array(await wb.xlsx.writeBuffer()))
    const move = async (from: string, to: string) => {
      zip.file(to, await zip.file(from)!.async('uint8array'))
      zip.remove(from)
    }
    await move('xl/comments1.xml', 'xl/comments/comment1.xml')
    await move('xl/drawings/vmlDrawing1.vml', 'xl/drawings/commentsDrawing1.vml')
    const rels = 'xl/worksheets/_rels/sheet1.xml.rels'
    const xml = (await zip.file(rels)!.async('string'))
      .replace('../comments1.xml', '/xl/comments/comment1.xml')
      .replace('../drawings/vmlDrawing1.vml', '/xl/drawings/commentsDrawing1.vml')
    zip.file(rels, xml)
    return new Blob([await zip.generateAsync({ type: 'arraybuffer' })])
  }

  test('reads a file whose comments are where openpyxl puts them (exceljs alone fails on it)', async () => {
    const file = await openpyxlStyle()
    await expect(new ExcelJS.Workbook().xlsx.load(await file.arrayBuffer())).rejects.toThrow()
    const parsed = await parseWorkbook(file)
    expect(parsed.ok && parsed.rows.map((r) => r.row.word)).toEqual(['shelter'])
  })
})
