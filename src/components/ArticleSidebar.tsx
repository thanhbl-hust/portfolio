import { Link } from 'react-router-dom'
import { articleGroups } from '../content'

interface ArticleSidebarProps {
  currentSlug: string
  onNavigate?: () => void
}

/** Every post, grouped by tag as on the index, and laid out like the table of
 * contents on the other side: the tags numbered along one rail, their posts
 * nested under them, and the one being read lit up. */
export function ArticleSidebar({ currentSlug, onNavigate }: ArticleSidebarProps) {
  return (
    <nav className="toc" aria-label="All posts">
      <p className="toc__heading">All Posts</p>
      <ol className="toc__list">
        {articleGroups.map((group) => (
          <li key={group.tag}>
            <span className="toc__group">{group.tag}</span>
            <ol className="toc__list">
              {group.articles.map((article) => (
                <li key={article.slug}>
                  <Link
                    to={`/article/${article.slug}`}
                    onClick={onNavigate}
                    aria-current={article.slug === currentSlug ? 'page' : undefined}
                  >
                    {article.title}
                  </Link>
                </li>
              ))}
            </ol>
          </li>
        ))}
      </ol>
    </nav>
  )
}
