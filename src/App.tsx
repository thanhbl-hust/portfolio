import { Suspense, lazy, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { HashRouter, Route, Routes, useLocation } from 'react-router-dom'
import { PillNav } from './components/PillNav'
import { NotFoundPage } from './pages/NotFoundPage'
import { Brand } from './components/Brand'
import { ScrollProgress } from './components/ScrollProgress'
import { TopControls } from './components/TopControls'
import { BackToTop } from './components/BackToTop'
import { ErrorBoundary } from './components/ErrorBoundary'
import { HeaderSlotContext } from './components/headerSlotContext'
import { reloadIfStaleBuild } from './staleBuild'

// Each route is its own chunk: the article page carries the markdown renderer
// and highlight.js, which the other two pages never touch.
const loadPortfolio = () => import('./pages/PortfolioPage')
const loadBlogs = () => import('./pages/BlogsPage')
const loadArticle = () => import('./pages/ArticlePage')

const PortfolioPage = lazy(() => loadPortfolio().then((m) => ({ default: m.PortfolioPage })))
const BlogsPage = lazy(() => loadBlogs().then((m) => ({ default: m.BlogsPage })))
const ArticlePage = lazy(() => loadArticle().then((m) => ({ default: m.ArticlePage })))

// Scroll position doesn't reset automatically on client-side navigation,
// which would leave a new (differently sized) page landing mid-scroll and
// the progress bar showing a stale percentage.
function ScrollToTopOnNavigate() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

/** Fetches the other routes' code once the first page is up and the browser is
 * idle. Cold, the first click onto a page waited ~250ms on its chunk; warm it
 * takes ~1-70ms. The 3D scene is left out - see PillNav. */
function PrefetchRoutes() {
  useEffect(() => {
    const warm = () => {
      // A failed prefetch costs nothing: the page's own import tries again, and
      // if the chunk is really gone the route's error boundary takes over.
      for (const load of [loadPortfolio, loadBlogs, loadArticle]) void load().catch(() => {})
    }
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(warm, { timeout: 4000 })
      return () => window.cancelIdleCallback(id)
    }
    const id = setTimeout(warm, 2000)
    return () => clearTimeout(id)
  }, [])
  return null
}

/** Shown in place of a page that threw, instead of an empty screen. */
function PageError() {
  return (
    <section className="notfound">
      <h1 className="notfound__title">This page didn&rsquo;t load</h1>
      <p className="notfound__body">
        Something went wrong while opening it &mdash; usually a dropped connection, or the site
        having been updated since this tab was opened.
      </p>
      <p className="notfound__links">
        <button type="button" className="notfound__retry" onClick={() => window.location.reload()}>
          Reload the page
        </button>
      </p>
    </section>
  )
}

/** One boundary around the pages, cleared on the way to the next one. */
function RouteBoundary({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  return (
    <ErrorBoundary resetKey={pathname} fallback={<PageError />} onError={reloadIfStaleBuild}>
      {children}
    </ErrorBoundary>
  )
}

export default function App() {
  const [headerSlot, setHeaderSlot] = useState<HTMLElement | null>(null)

  return (
    <HashRouter>
      <HeaderSlotContext.Provider value={headerSlot}>
        <ScrollToTopOnNavigate />
        <PrefetchRoutes />
        <ScrollProgress />
        <div className="top-bar" />
        <header className="site-header">
          <Brand />
          <TopControls slotRef={setHeaderSlot} />
        </header>
        <BackToTop />
        <div className="page">
          <main className="content">
            <RouteBoundary>
              <Suspense fallback={null}>
                <Routes>
                  <Route path="/" element={<PortfolioPage />} />
                  <Route path="/blogs" element={<BlogsPage />} />
                  <Route path="/article/:slug" element={<ArticlePage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </Suspense>
            </RouteBoundary>
          </main>

          <footer className="topnav">
            <PillNav />
          </footer>
        </div>
      </HeaderSlotContext.Provider>
    </HashRouter>
  )
}
