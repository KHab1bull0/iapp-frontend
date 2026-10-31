import { useMessages } from './index'
import { coreMessages } from './messages'

/** The shell's messages in the current language. */
export function useCoreT() {
  return useMessages(coreMessages)
}
