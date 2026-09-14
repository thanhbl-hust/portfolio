import { useContext } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { HeaderSlotContext } from './headerSlotContext'

/** Renders its children into the header's control row, once the header is up. */
export function HeaderSlot({ children }: { children: ReactNode }) {
  const slot = useContext(HeaderSlotContext)
  return slot ? createPortal(children, slot) : null
}
