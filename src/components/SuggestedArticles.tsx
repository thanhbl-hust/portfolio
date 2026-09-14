import { useRef } from 'react'
import { getSuggestedArticles } from '../content'
import { useRevealChildren } from '../hooks/useRevealChildren'
import { BlogCard } from './BlogCard'

interface SuggestedArticlesProps {
  currentSlug: string
}

export function SuggestedArticles({ currentSlug }: SuggestedArticlesProps) {
  const suggestions = getSuggestedArticles(currentSlug)
  const listRef = useRef<HTMLDivElement>(null)
  // Each article brings fresh cards, and they start out hidden.
  useRevealChildren(listRef, [currentSlug])

  if (suggestions.length === 0) return null

  return (
    <section className="suggested">
      <p className="suggested__heading">More to Read</p>
      <div className="blog-list reveal-group" ref={listRef}>
        {suggestions.map((article) => (
          <BlogCard key={article.slug} article={article} />
        ))}
      </div>
    </section>
  )
}
