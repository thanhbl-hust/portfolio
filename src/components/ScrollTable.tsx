import { useRef } from 'react'
import type { ReactNode } from 'react'
import { useKeyboardScrollable } from '../hooks/useKeyboardScrollable'

/** A markdown table in a box of its own that scrolls sideways, so a wide one
 * never stretches the page on a phone. */
export function ScrollTable({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useKeyboardScrollable(ref)
  return (
    <div className="table-scroll" ref={ref}>
      <table>{children}</table>
    </div>
  )
}
