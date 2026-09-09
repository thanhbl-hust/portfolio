import { useMemo, useRef, useState } from 'react'
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
import { ArticleSidebar } from '../components/ArticleSidebar'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useModalDismiss } from '../hooks/useModalDismiss'
import { useRevealChildren } from '../hooks/useRevealChildren'

const MIN_HEADINGS_FOR_TOC = 2

export function ArticlePage() {
  const { slug } = useParams<{ slug: string }>()
  const article = slug ? getArticle(slug) : undefined
  const toc = useMemo(() => (article ? buildToc(article.body) : []), [article])
  useDocumentTitle(article?.title)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const bodyRef = useRef<HTMLDivElement>(null)
  useRevealChildren(bodyRef, [article?.slug])

  useModalDismiss(drawerOpen, setDrawerOpen)

  if (!article) {
    return <Navigate to="/blogs" replace />
  }

  const showToc = countHeadings(toc) >= MIN_HEADINGS_FOR_TOC

  return (
    <div className="article-layout">
      <button type="button" className="blogs-toggle" onClick={() => setDrawerOpen(true)}>
        Blogs
      </button>

      <aside className="article-sidebar article-sidebar--desktop">
        <ArticleSidebar currentSlug={article.slug} />
      </aside>

      <div
        className={`article-drawer-backdrop${drawerOpen ? ' article-drawer-backdrop--open' : ''}`}
        onClick={() => setDrawerOpen(false)}
        aria-hidden={!drawerOpen}
      >
        <div className="article-drawer" onClick={(event) => event.stopPropagation()}>
          <button
            type="button"
            className="article-drawer__close"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close"
            tabIndex={drawerOpen ? 0 : -1}
          >
            ×
          </button>
          <ArticleSidebar currentSlug={article.slug} onNavigate={() => setDrawerOpen(false)} />
        </div>
      </div>

      <article className="article">
        <Link to="/blogs" className="article__back">
          ← Back to Blogs
        </Link>

        <header className="article__header">
          <h1 className="article__title">{article.title}</h1>
          <div className="article__meta">
            {article.date && (
              <time className="article__date" dateTime={article.date}>
                {article.date}
              </time>
            )}
            {article.tag && <span className="tag-pill">{article.tag}</span>}
          </div>
        </header>

        {showToc && <TableOfContents items={toc} />}

        <div className="article__body" ref={bodyRef}>
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
    </div>
  )
}
