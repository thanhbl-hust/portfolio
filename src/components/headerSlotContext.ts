import { createContext } from 'react'

/** The start of the header's control row, where a page can put a control of its
 * own - the article page's Blogs button. It then sits in the same flex row as
 * the icons instead of being positioned by hand beside them, which broke every
 * time the icons or the brand changed width. In its own module so that
 * HeaderSlot.tsx exports nothing but a component, as fast refresh needs. */
export const HeaderSlotContext = createContext<HTMLElement | null>(null)
