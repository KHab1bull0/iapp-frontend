import { Sheet } from '@/core/components/ui/Sheet'
import type { Word } from '@/modules/english/api/english'
import { useEnglishT } from '@/modules/english/i18n'
import { WordForm } from './WordForm'

/** Add/edit a word: a bottom sheet on phones, a dialog on desktop. */
export function WordDialog({
  open,
  onOpenChange,
  word,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  word?: Word | null
}) {
  const t = useEnglishT()
  return (
    <Sheet desktop="panel" open={open} onOpenChange={onOpenChange} title={word ? t.word.editTitle : t.word.newTitle}>
      <WordForm
        key={`${word?.id ?? 'new'}-${String(open)}`}
        word={word ?? null}
        onSaved={() => onOpenChange(false)}
        onCancel={() => onOpenChange(false)}
      />
    </Sheet>
  )
}
