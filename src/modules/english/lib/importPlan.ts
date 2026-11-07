import type { Tag } from '@/modules/english/api/english'
import type { ParsedRow } from './excel'

export type ImportStatus = 'new' | 'exists' | 'repeated' | 'invalid'

/**
 * What the import will do with each row of a file: add it, skip it (already
 * in the vocabulary, or repeated in the file) or leave it out (an error); and
 * which tags the file names that the user doesn't have yet. The server
 * decides the same way; this is the preview.
 */
export function classify(rows: ParsedRow[], existingWords: string[], tags: Pick<Tag, 'id' | 'name'>[]) {
  const existing = new Set(existingWords.map((w) => w.toLowerCase()))
  const known = new Set(tags.flatMap((tg) => [tg.id, tg.name.toLowerCase()]))
  const seen = new Set<string>()
  const newTags = new Map<string, string>()
  const statuses = rows.map((r): ImportStatus => {
    if (r.problems.length) return 'invalid'
    const lower = r.row.word.toLowerCase()
    if (existing.has(lower)) return 'exists'
    if (seen.has(lower)) return 'repeated'
    seen.add(lower)
    for (const name of r.row.tags ?? []) {
      const lower = name.toLowerCase()
      if (!known.has(name) && !known.has(lower) && !newTags.has(lower)) newTags.set(lower, name)
    }
    return 'new'
  })
  const count = (st: ImportStatus) => statuses.filter((x) => x === st).length
  return {
    statuses,
    toAdd: rows.filter((_, i) => statuses[i] === 'new').map((r) => r.row),
    counts: { new: count('new'), exists: count('exists'), repeated: count('repeated'), invalid: count('invalid') },
    newTags: [...newTags.values()],
  }
}

