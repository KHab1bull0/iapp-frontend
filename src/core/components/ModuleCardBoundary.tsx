import { Component, type ReactNode } from 'react'
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
      return <div className={s.failed}>{this.props.moduleName} couldn't load</div>
    }
    return this.props.children
  }
}
