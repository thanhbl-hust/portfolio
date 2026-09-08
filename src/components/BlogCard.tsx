import { Link } from 'react-router-dom'
import type { Article } from '../content'

function formatDate(iso: string): string {
  if (!iso) return ''
  const date = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

interface BlogCardProps {
  article: Article
}

export function BlogCard({ article }: BlogCardProps) {
  return (
    <Link to={`/article/${article.slug}`} className="blog-card">
      <div className="blog-card__meta">
        {article.date && <span className="blog-card__date">{formatDate(article.date)}</span>}
        {article.tag && <span className="tag-pill">{article.tag}</span>}
      </div>
      <h2 className="blog-card__title">{article.title}</h2>
      {article.excerpt && <p className="blog-card__excerpt">{article.excerpt}</p>}
    </Link>
  )
}
