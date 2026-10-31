import { Component, type ReactNode } from 'react'
import { isChunkLoadError, reloadOnce } from '@/core/lib/chunk-reload'
import { useCoreT } from '@/core/i18n/useCoreT'
import s from './ChunkErrorBoundary.module.scss'

interface Props {
  children: ReactNode
  /** Injected in tests; defaults to window.location.reload. */
  reload?: () => void
}

interface State {
  error: unknown
}

/**
 * Wraps lazily loaded pages. A page chunk that vanished in a deploy triggers a
 * single reload onto the new build; any other error propagates as before.
 */
export class ChunkErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: unknown): State {
    return { error }
  }

  componentDidCatch(error: unknown) {
    if (isChunkLoadError(error)) reloadOnce(this.props.reload)
  }

  render() {
    const { error } = this.state
    if (error === null) return this.props.children
    if (!isChunkLoadError(error)) throw error

    return <ReloadNotice reload={this.props.reload ?? (() => window.location.reload())} />
  }
}

function ReloadNotice({ reload }: { reload: () => void }) {
  const t = useCoreT()
  return (
    <div className={s.notice}>
      <p>{t.boundary.newVersion}</p>
      <button className={s.button} onClick={reload}>
        {t.boundary.reload}
      </button>
    </div>
  )
}
