import { forwardRef } from 'react'
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog'
import { cn } from '@/core/lib/utils'
import { buttonVariants } from '@/core/components/ui/button'

const AlertDialog = AlertDialogPrimitive.Root
const AlertDialogTrigger = AlertDialogPrimitive.Trigger
const AlertDialogPortal = AlertDialogPrimitive.Portal

const AlertDialogOverlay = forwardRef<
  React.ComponentRef<typeof AlertDialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity data-[state=open]:opacity-100 data-[state=closed]:opacity-0',
      className,
    )}
    {...props}
  />
))
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName

const AlertDialogContent = forwardRef<
  React.ComponentRef<typeof AlertDialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>
>(({ className, ...props }, ref) => (
  <AlertDialogPortal>
    <AlertDialogOverlay />
    <AlertDialogPrimitive.Content
      ref={ref}
      // AlertDialog additionally auto-focuses its Cancel button. Suppressed for
      // the same reason as Dialog — no focus without an explicit user tap.
      onOpenAutoFocus={(e) => e.preventDefault()}
      onCloseAutoFocus={(e) => e.preventDefault()}
      className={cn(
        'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
        'w-[calc(100%-2rem)] max-w-md max-h-[85dvh] overflow-y-auto overscroll-contain',
        'rounded-lg border bg-background p-6 shadow-xl transition-all data-[state=open]:opacity-100 data-[state=closed]:opacity-0',
        className,
      )}
      {...props}
    />
  </AlertDialogPortal>
))
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName

function AlertDialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col space-y-2 mb-4', className)} {...props} />
}
AlertDialogHeader.displayName = 'AlertDialogHeader'

function AlertDialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-row gap-3 mt-6', className)}
      {...props}
    />
  )
}
AlertDialogFooter.displayName = 'AlertDialogFooter'

const AlertDialogTitle = forwardRef<
  React.ComponentRef<typeof AlertDialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Title
    ref={ref}
    className={cn('text-lg font-semibold', className)}
    {...props}
  />
))
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName

const AlertDialogDescription = forwardRef<
  React.ComponentRef<typeof AlertDialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
))
AlertDialogDescription.displayName = AlertDialogPrimitive.Description.displayName

const AlertDialogAction = forwardRef<
  React.ComponentRef<typeof AlertDialogPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Action
    ref={ref}
    className={cn(buttonVariants(), 'flex-1', className)}
    {...props}
  />
))
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName

const AlertDialogCancel = forwardRef<
  React.ComponentRef<typeof AlertDialogPrimitive.Cancel>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Cancel
    ref={ref}
    className={cn(buttonVariants({ variant: 'outline' }), 'flex-1', className)}
    {...props}
  />
))
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName

export {
  AlertDialog, AlertDialogPortal, AlertDialogOverlay, AlertDialogTrigger,
  AlertDialogContent, AlertDialogHeader, AlertDialogFooter,
  AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel,
}
