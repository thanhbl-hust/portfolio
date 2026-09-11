import { useLocation } from 'react-router-dom'
import type { MouseEvent } from 'react'
import type { TocItem } from '../toc'

interface TableOfContentsProps {
  items: TocItem[]
  /** The section currently on screen, from useActiveHeading. */
  activeId?: string
  /** Scrolls to the picked heading - useActiveHeading's scrollToHeading. */
  onSelect: (id: string) => void
}

export function TableOfContents({ items, activeId, onSelect }: TableOfContentsProps) {
  const { pathname } = useLocation()
  if (items.length === 0) return null

  // The router owns the URL hash (#/article/<slug>), so an entry hands the
  // scrolling to onSelect rather than navigating to #<heading-id>: that would
  // replace the route, and a reload would then land on the 404 page. The href
  // is only for middle-click and "copy link", where it opens this article.
  function pick(event: MouseEvent<HTMLAnchorElement>, id: string) {
    event.preventDefault()
    onSelect(id)
  }

  const link = (item: TocItem) => (
    <a
      href={`#${pathname}`}
      onClick={(event) => pick(event, item.id)}
      aria-current={item.id === activeId ? 'location' : undefined}
    >
      {item.text}
    </a>
  )

  return (
    <nav className="toc" aria-label="Table of contents">
      <p className="toc__heading">Table of Contents</p>
      <ol className="toc__list">
        {items.map((item) => (
          <li key={item.id}>
            {link(item)}
            {item.children.length > 0 && (
              <ol className="toc__list">
                {item.children.map((child) => (
                  <li key={child.id}>{link(child)}</li>
                ))}
              </ol>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
