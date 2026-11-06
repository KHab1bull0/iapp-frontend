import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useIsMobile } from '@/core/hooks/useMediaQuery'
import type { Word } from '@/modules/english/api/english'
import { WordDialog } from './components/WordDialog'

/**
 * Add and edit: a page of its own on phones (/english/new,
 * /english/:id/edit), a panel over the current page on desktop.
 */
export function useWordEditor() {
  const isMobile = useIsMobile()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [word, setWord] = useState<Word | null>(null)

  return {
    openNew() {
      if (isMobile) return navigate('/english/new')
      setWord(null)
      setOpen(true)
    },
    openEdit(w: Word) {
      if (isMobile) return navigate(`/english/${w.id}/edit`)
      setWord(w)
      setOpen(true)
    },
    dialog: <WordDialog open={open} onOpenChange={setOpen} word={word} />,
  }
}
