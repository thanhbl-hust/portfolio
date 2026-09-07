import { BlogCard } from '../components/BlogCard'
import { articles } from '../content'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export function BlogsPage() {
  useDocumentTitle('Blogs')

  return (
    <div className="blog-list">
      {articles.map((article) => (
        <BlogCard key={article.slug} article={article} />
      ))}
    </div>
  )
}
