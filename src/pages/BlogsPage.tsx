import { useRef } from 'react'
import { BlogCard } from '../components/BlogCard'
import { articles } from '../content'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useRevealChildren } from '../hooks/useRevealChildren'

export function BlogsPage() {
  useDocumentTitle('Blogs')
  const listRef = useRef<HTMLDivElement>(null)
  useRevealChildren(listRef)

  return (
    <>
      <h1 className="visually-hidden">Blog posts</h1>
      <div className="blog-list" ref={listRef}>
        {articles.map((article) => (
          <BlogCard key={article.slug} article={article} />
        ))}
      </div>
    </>
  )
}
