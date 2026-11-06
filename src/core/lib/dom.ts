/**
 * Whether a dialog is open right now. A closed drawer can stay in the DOM
 * with role="dialog" (inert or hidden); that one doesn't count.
 */
export function isDialogOpen(): boolean {
  return Array.from(document.querySelectorAll('[role="dialog"], [role="alertdialog"]')).some(
    (el) => !el.closest('[inert]') && el.getAttribute('aria-hidden') !== 'true',
  )
}

/** True while typing in a field, so single-key shortcuts leave the keys alone. */
export function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  return !!el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))
}
