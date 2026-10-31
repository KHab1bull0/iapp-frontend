import { Component, type ReactNode } from 'react'
import { useCoreT } from '@/core/i18n/useCoreT'
import s from './ModuleCardBoundary.module.scss'

interface Props {
  moduleName: string
  children: ReactNode
}

interface State {
  failed: boolean
}

/**
 * Keeps one module's home card from taking the whole home page down. Data
 * errors are the card's own business (TanStack Query); this catches render
 * crashes.
 */
export class ModuleCardBoundary extends Component<Props, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  render() {
    if (this.state.failed) {
      return <FailedCard moduleName={this.props.moduleName} />
    }
    return this.props.children
  }
}

function FailedCard({ moduleName }: { moduleName: string }) {
  const t = useCoreT()
  return <div className={s.failed}>{t.boundary.cardFailed(moduleName)}</div>
}
