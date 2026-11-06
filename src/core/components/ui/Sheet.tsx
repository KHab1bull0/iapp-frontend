import type { ReactNode } from 'react'
import { Drawer } from 'vaul'
import { useIsMobile } from '@/core/hooks/useMediaQuery'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './dialog'
import s from './Sheet.module.scss'

interface SheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  description?: ReactNode
  /** Stays put at the bottom (in thumb reach) while the body scrolls: the save button goes here. */
  footer?: ReactNode
  children: ReactNode
  /** Hide the title visually (it is still read out). */
  hideTitle?: boolean
}

/**
 * A bottom sheet on phones and a centred dialog on wider screens. Forms open
 * here instead of on a page of their own, so the screen behind stays in view
 * and a swipe down puts it away.
 */
export function Sheet({ open, onOpenChange, title, description, footer, children, hideTitle }: SheetProps) {
  const isMobile = useIsMobile()

  if (!isMobile) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={s.dialog}>
          <DialogHeader className={hideTitle ? 'sr-only' : undefined}>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
          {children}
          {footer && <div className={s.dialogFooter}>{footer}</div>}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} repositionInputs={false}>
      <Drawer.Portal>
        <Drawer.Overlay className={s.overlay} />
        {/* Without a description, say so outright, or Radix warns that one is missing. */}
        <Drawer.Content className={s.sheet} {...(!description && { 'aria-describedby': undefined })}>
          <div className={s.handle} aria-hidden />
          <div className={hideTitle ? 'sr-only' : s.head}>
            <Drawer.Title className={s.title}>{title}</Drawer.Title>
            {description && <Drawer.Description className={s.description}>{description}</Drawer.Description>}
          </div>
          <div className={s.body}>{children}</div>
          {footer && <div className={s.footer}>{footer}</div>}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
