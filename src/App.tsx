import { Suspense, lazy, useEffect } from 'react'
import { HashRouter, Route, Routes, useLocation } from 'react-router-dom'
import { PillNav } from './components/PillNav'
import { NotFoundPage } from './pages/NotFoundPage'
import { Brand } from './components/Brand'
import { ScrollProgress } from './components/ScrollProgress'
import { TopControls } from './components/TopControls'
import { BackToTop } from './components/BackToTop'

// Each route is its own chunk: the article page carries the markdown renderer
// and highlight.js, which the other two pages never touch.
const PortfolioPage = lazy(() => import('./pages/PortfolioPage').then((m) => ({ default: m.PortfolioPage })))
const BlogsPage = lazy(() => import('./pages/BlogsPage').then((m) => ({ default: m.BlogsPage })))
const ArticlePage = lazy(() => import('./pages/ArticlePage').then((m) => ({ default: m.ArticlePage })))

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

export default function App() {
  return (
    <HashRouter>
      <ScrollToTopOnNavigate />
      <ScrollProgress />
      <div className="top-bar" />
      <Brand />
      <TopControls />
      <BackToTop />
      <div className="page">
        <main className="content">
          <Suspense fallback={null}>
            <Routes>
              <Route path="/" element={<PortfolioPage />} />
              <Route path="/blogs" element={<BlogsPage />} />
              <Route path="/article/:slug" element={<ArticlePage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </main>

        <footer className="topnav">
          <PillNav />
        </footer>
      </div>
    </HashRouter>
  )
}
