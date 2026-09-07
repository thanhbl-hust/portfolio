import type { TocItem } from '../toc'

interface TableOfContentsProps {
  items: TocItem[]
}

function scrollToHeading(event: React.MouseEvent<HTMLAnchorElement>, id: string) {
  event.preventDefault()
  const target = document.getElementById(id)
  if (!target) return
  target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  history.replaceState(null, '', `#${id}`)
}

export function TableOfContents({ items }: TableOfContentsProps) {
  if (items.length === 0) return null

  return (
    <nav className="toc" aria-label="Table of contents">
      <p className="toc__heading">Table of Contents</p>
      <ol className="toc__list">
        {items.map((item) => (
          <li key={item.id}>
            <a href={`#${item.id}`} onClick={(event) => scrollToHeading(event, item.id)}>
              {item.text}
            </a>
            {item.children.length > 0 && (
              <ol className="toc__list">
                {item.children.map((child) => (
                  <li key={child.id}>
                    <a href={`#${child.id}`} onClick={(event) => scrollToHeading(event, child.id)}>
                      {child.text}
                    </a>
                  </li>
                ))}
              </ol>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
