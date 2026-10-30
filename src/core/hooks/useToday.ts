import { useEffect, useState } from 'react'
import { todayYmd } from '@/core/lib/format'

/**
 * Today's date on this device, kept current. An installed app can stay open
 * across midnight, or be resumed the next morning without re-rendering, so
 * this rolls over at midnight and re-checks whenever the app is shown again.
 */
export function useToday(): string {
  const [today, setToday] = useState(todayYmd)

  useEffect(() => {
    const sync = () => setToday(todayYmd())

    let timer: ReturnType<typeof setTimeout>
    const scheduleMidnight = () => {
      const now = new Date()
      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
      timer = setTimeout(() => {
        sync()
        scheduleMidnight()
      }, midnight.getTime() - now.getTime() + 1000)
    }
    scheduleMidnight()

    const onVisible = () => {
      if (document.visibilityState !== 'hidden') sync()
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', sync)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', sync)
    }
  }, [])

  return today
}
