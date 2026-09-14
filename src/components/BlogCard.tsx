import { Link } from 'react-router-dom'
import { formatDate } from '../content'
import type { Article } from '../content'

interface BlogCardProps {
  article: Article
  /** Off where the tag is already given, as under a tag's heading. */
  showTag?: boolean
}

export function BlogCard({ article, showTag = true }: BlogCardProps) {
  return (
    <Link to={`/article/${article.slug}`} className="blog-card">
      <div className="blog-card__meta">
        {article.date && <span className="blog-card__date">{formatDate(article.date)}</span>}
        {showTag && article.tag && <span className="tag-pill">{article.tag}</span>}
      </div>
      <h2 className="blog-card__title">{article.title}</h2>
      {article.excerpt && (
        <p className="blog-card__excerpt" lang={article.lang}>
          {article.excerpt}
        </p>
      )}
    </Link>
  )
}
