import { Link } from 'react-router-dom'
import { articles } from '../content'

interface ArticleSidebarProps {
  currentSlug: string
  onNavigate?: () => void
}

export function ArticleSidebar({ currentSlug, onNavigate }: ArticleSidebarProps) {
  return (
    <nav className="article-sidebar__list" aria-label="All posts">
      <h2 className="article-sidebar__heading">All Posts</h2>
      <ul>
        {articles.map((article) => (
          <li key={article.slug}>
            <Link
              to={`/article/${article.slug}`}
              onClick={onNavigate}
              className={
                article.slug === currentSlug
                  ? 'article-sidebar__item article-sidebar__item--active'
                  : 'article-sidebar__item'
              }
            >
              {article.tag && <span className="tag-pill">{article.tag}</span>}
              <span className="article-sidebar__title">{article.title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
