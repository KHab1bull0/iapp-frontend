import { useState } from 'react'
import type { Word } from '@/modules/english/api/english'
import { WordDialog } from './components/WordDialog'

/** Add and edit open the word sheet (bottom sheet on phones, dialog on desktop). */
export function useWordEditor() {
  const [open, setOpen] = useState(false)
  const [word, setWord] = useState<Word | null>(null)

  return {
    openNew() {
      setWord(null)
      setOpen(true)
    },
    openEdit(w: Word) {
      setWord(w)
      setOpen(true)
    },
    dialog: <WordDialog open={open} onOpenChange={setOpen} word={word} />,
  }
}
