import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/core/components/ui/dialog'
import type { Word } from '@/modules/english/api/english'
import { WordForm } from './WordForm'

/** Desktop container for WordForm; touch layouts route to WordFormPage. */
export function WordDialog({
  open,
  onOpenChange,
  word,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  word?: Word | null
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{word ? 'Edit word' : 'New word'}</DialogTitle>
        </DialogHeader>
        <WordForm
          key={`${word?.id ?? 'new'}-${String(open)}`}
          word={word ?? null}
          onSaved={() => onOpenChange(false)}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
