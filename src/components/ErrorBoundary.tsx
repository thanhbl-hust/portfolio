import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

type ErrorBoundaryProps = {
  children: ReactNode
  /** Rendered in place of the children once they have thrown. */
  fallback: ReactNode
  /** A new value clears the error for another try - the route, for one. */
  resetKey?: unknown
  onError?: (error: unknown) => void
}

type ErrorBoundaryState = { failed: boolean; resetKey: unknown }

/**
 * Keeps a crash to the part of the page that crashed. React unmounts the whole
 * app on an error nothing catches, so a route chunk that failed to load, or a
 * 3D scene that failed to start, used to leave a blank page.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { failed: false, resetKey: this.props.resetKey }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  // Worked out during render, not in componentDidUpdate, which would draw the
  // fallback once more before the retry.
  static getDerivedStateFromProps(props: ErrorBoundaryProps, state: ErrorBoundaryState) {
    return props.resetKey === state.resetKey ? null : { failed: false, resetKey: props.resetKey }
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error(error, info.componentStack)
    this.props.onError?.(error)
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}
