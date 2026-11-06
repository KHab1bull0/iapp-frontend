import type { ReactNode } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { Drawer } from 'vaul'
import { useCoreT } from '@/core/i18n/useCoreT'
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
  /**
   * On desktop: a centred dialog (choices, pickers) or a panel along the
   * right edge (editing an item, so the list it came from stays in view).
   */
  desktop?: 'dialog' | 'panel'
}

/**
 * A bottom sheet on phones and a centred dialog on wider screens. Forms open
 * here instead of on a page of their own, so the screen behind stays in view
 * and a swipe down puts it away.
 */
export function Sheet({ open, onOpenChange, title, description, footer, children, hideTitle, desktop = 'dialog' }: SheetProps) {
  const isMobile = useIsMobile()
  const t = useCoreT()

  if (!isMobile && desktop === 'panel') {
    return (
      <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className={s.panelOverlay} />
          <DialogPrimitive.Content
            className={s.panel}
            onOpenAutoFocus={(e) => e.preventDefault()}
            {...(!description && { 'aria-describedby': undefined })}
          >
            <div className={s.panelHead}>
              <div className={hideTitle ? 'sr-only' : undefined}>
                <DialogPrimitive.Title className={s.title}>{title}</DialogPrimitive.Title>
                {description && <DialogPrimitive.Description className={s.description}>{description}</DialogPrimitive.Description>}
              </div>
              <DialogPrimitive.Close className={s.panelClose} aria-label={t.common.close}>
                <X size={18} />
              </DialogPrimitive.Close>
            </div>
            <div className={s.body}>{children}</div>
            {footer && <div className={s.footer}>{footer}</div>}
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    )
  }

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
