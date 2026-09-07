import { getSuggestedArticles } from '../content'
import { BlogCard } from './BlogCard'

interface SuggestedArticlesProps {
  currentSlug: string
}

export function SuggestedArticles({ currentSlug }: SuggestedArticlesProps) {
  const suggestions = getSuggestedArticles(currentSlug)

  if (suggestions.length === 0) return null

  return (
    <section className="suggested">
      <p className="suggested__heading">More to Read</p>
      <div className="blog-list">
        {suggestions.map((article) => (
          <BlogCard key={article.slug} article={article} />
        ))}
      </div>
    </section>
  )
}
