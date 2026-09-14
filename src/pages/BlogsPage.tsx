import { useId, useRef } from 'react'
import { BlogCard } from '../components/BlogCard'
import { articleGroups } from '../content'
import type { TagGroup } from '../content'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useRevealChildren } from '../hooks/useRevealChildren'

/** One tag's posts: a heading with the count, then their cards. */
function TagSection({ group }: { group: TagGroup }) {
  const headingId = useId()
  const listRef = useRef<HTMLDivElement>(null)
  useRevealChildren(listRef)
  const count = group.articles.length

  return (
    <section className="blog-group" aria-labelledby={headingId}>
      <h2 className="blog-group__title" id={headingId}>
        {group.tag}
        <span className="blog-group__count">
          {count}
          <span className="visually-hidden">{count === 1 ? ' post' : ' posts'}</span>
        </span>
      </h2>
      {/* The heading already names the tag, so the cards leave their pill off. */}
      <div className="blog-list blog-list--grid reveal-group" ref={listRef}>
        {group.articles.map((article) => (
          <BlogCard key={article.slug} article={article} showTag={false} />
        ))}
      </div>
    </section>
  )
}

export function BlogsPage() {
  useDocumentTitle('Blogs')

  return (
    <div className="blog-groups">
      <h1 className="visually-hidden">Blog posts</h1>
      {articleGroups.map((group) => (
        <TagSection key={group.tag} group={group} />
      ))}
    </div>
  )
}
