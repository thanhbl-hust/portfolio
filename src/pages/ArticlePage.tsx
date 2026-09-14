import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import rehypeHighlight from 'rehype-highlight'
import { formatDate, getArticle } from '../content'
import { buildToc, countHeadings } from '../toc'
import { TableOfContents } from '../components/TableOfContents'
import { CodeBlock } from '../components/CodeBlock'
import { ScrollTable } from '../components/ScrollTable'
import { SuggestedArticles } from '../components/SuggestedArticles'
import { ArticleSidebar } from '../components/ArticleSidebar'
import { HeaderSlot } from '../components/HeaderSlot'
import { useActiveHeading } from '../hooks/useActiveHeading'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useModalDismiss } from '../hooks/useModalDismiss'
import { useRevealChildren } from '../hooks/useRevealChildren'

const MIN_HEADINGS_FOR_TOC = 2

const REMARK_PLUGINS = [remarkGfm]
const REHYPE_PLUGINS = [rehypeSlug, rehypeHighlight]

const isExternal = (href: string | undefined) => href?.startsWith('http') ?? false

// Module-level so each keeps one identity: a component defined during render is
// a new type every time, and React remounts whatever it rendered - which put
// tables back to the hidden state of the scroll reveal for good. Each one also
// drops the `node` (syntax tree) prop react-markdown passes, which spread onto
// the element came out as node="[object Object]".
const MARKDOWN_COMPONENTS: Components = {
  pre: CodeBlock,
  table: ({ node: _node, children }) => <ScrollTable>{children}</ScrollTable>,
  a: ({ node: _node, href, children, ...props }) => (
    <a
      href={href}
      {...props}
      target={isExternal(href) ? '_blank' : undefined}
      rel={isExternal(href) ? 'noopener noreferrer' : undefined}
    >
      {children}
    </a>
  ),
  // Mostly below the fold, so fetched on the way down rather than with the page.
  img: ({ node: _node, ...props }) => <img {...props} loading="lazy" decoding="async" />,
  // A task list's checkboxes, named so a screen reader says what they mean.
  input: ({ node: _node, ...props }) =>
    props.type === 'checkbox' ? (
      <input {...props} aria-label={props.checked ? 'Done' : 'Not done'} />
    ) : (
      <input {...props} />
    ),
}

/** The rendered post. Memoised: the page re-renders each time the scroll-spy
 * reaches a new section or the drawer opens, and every render of
 * <ReactMarkdown> parses and highlights the whole post again. */
const ArticleBody = memo(function ArticleBody({ body }: { body: string }) {
  return (
    <ReactMarkdown remarkPlugins={REMARK_PLUGINS} rehypePlugins={REHYPE_PLUGINS} components={MARKDOWN_COMPONENTS}>
      {body}
    </ReactMarkdown>
  )
})

export function ArticlePage() {
  const { slug } = useParams<{ slug: string }>()
  const article = slug ? getArticle(slug) : undefined
  const toc = useMemo(() => (article ? buildToc(article.body) : []), [article])
  useDocumentTitle(article?.title)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const bodyRef = useRef<HTMLDivElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const wasOpen = useRef(false)
  useRevealChildren(bodyRef, [article?.slug])
  // One scroll-spy feeding both copies of the contents: the left rail on wide
  // screens and the one inside the drawer on narrow ones.
  const { activeId: activeHeading, scrollToHeading } = useActiveHeading(toc)

  useModalDismiss(drawerOpen, setDrawerOpen)

  // Focus moves into the drawer as it opens and back to the Blogs button as it
  // closes. Closed, the drawer is inert (below) - it is only slid off screen,
  // and keyboard users used to tab through every link in it without seeing one.
  useEffect(() => {
    if (drawerOpen) closeRef.current?.focus({ preventScroll: true })
    else if (wasOpen.current) toggleRef.current?.focus({ preventScroll: true })
    wasOpen.current = drawerOpen
  }, [drawerOpen])

  if (!article) {
    return <Navigate to="/blogs" replace />
  }

  const showToc = countHeadings(toc) >= MIN_HEADINGS_FOR_TOC

  return (
    <div className="article-layout">
      {/* Rendered into the header's control row, next to the icons. */}
      <HeaderSlot>
        <button
          type="button"
          className="blogs-toggle"
          ref={toggleRef}
          aria-haspopup="dialog"
          onClick={() => setDrawerOpen(true)}
        >
          Blogs
        </button>
      </HeaderSlot>

      {/* Plain boxes, not <aside>: the <nav> inside each is already the landmark,
        * and two unnamed asides read to a screen reader as the same one twice. */}
      {showToc && (
        <div className="article-toc article-toc--desktop">
          <TableOfContents items={toc} activeId={activeHeading} onSelect={scrollToHeading} />
        </div>
      )}

      <div className="article-sidebar article-sidebar--desktop">
        <ArticleSidebar currentSlug={article.slug} />
      </div>

      <div
        className={`article-drawer-backdrop${drawerOpen ? ' article-drawer-backdrop--open' : ''}`}
        onClick={() => setDrawerOpen(false)}
        inert={!drawerOpen}
      >
        <div
          className="article-drawer"
          role="dialog"
          aria-label="Blogs"
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            className="article-drawer__close"
            ref={closeRef}
            onClick={() => setDrawerOpen(false)}
            aria-label="Close"
          >
            ×
          </button>
          {showToc && (
            <div className="article-drawer__toc">
              <TableOfContents
                items={toc}
                activeId={activeHeading}
                onSelect={(id) => {
                  scrollToHeading(id)
                  setDrawerOpen(false)
                }}
              />
            </div>
          )}
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
                {formatDate(article.date)}
              </time>
            )}
            {article.tag && <span className="tag-pill">{article.tag}</span>}
          </div>
        </header>

        <div className="article__body reveal-group" ref={bodyRef} lang={article.lang}>
          <ArticleBody body={article.body} />
        </div>

        <SuggestedArticles currentSlug={article.slug} />
      </article>
    </div>
  )
}
