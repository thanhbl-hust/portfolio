import { useMemo } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import rehypeHighlight from 'rehype-highlight'
import { getArticle } from '../content'
import { buildToc, countHeadings } from '../toc'
import { TableOfContents } from '../components/TableOfContents'
import { CodeBlock } from '../components/CodeBlock'
import { SuggestedArticles } from '../components/SuggestedArticles'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

const MIN_HEADINGS_FOR_TOC = 2

export function ArticlePage() {
  const { slug } = useParams<{ slug: string }>()
  const article = slug ? getArticle(slug) : undefined
  const toc = useMemo(() => (article ? buildToc(article.body) : []), [article])
  useDocumentTitle(article?.title)

  if (!article) {
    return <Navigate to="/blogs" replace />
  }

  const showToc = countHeadings(toc) >= MIN_HEADINGS_FOR_TOC

  return (
    <article className="article">
      <Link to="/blogs" className="article__back">
        ← Back to Blogs
      </Link>

      <header className="article__header">
        <h1 className="article__title">{article.title}</h1>
        {article.date && (
          <time className="article__date" dateTime={article.date}>
            {article.date}
          </time>
        )}
      </header>

      {showToc && <TableOfContents items={toc} />}

      <div className="article__body">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeSlug, rehypeHighlight]}
          components={{
            pre: CodeBlock,
            table: ({ children }) => (
              <div className="table-scroll">
                <table>{children}</table>
              </div>
            ),
            a: ({ href, children, ...props }) => (
              <a href={href} {...props} target={href?.startsWith('http') ? '_blank' : undefined} rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}>
                {children}
              </a>
            ),
          }}
        >
          {article.body}
        </ReactMarkdown>
      </div>

      <SuggestedArticles currentSlug={article.slug} />
    </article>
  )
}
