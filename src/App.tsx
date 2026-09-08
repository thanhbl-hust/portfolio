import { useEffect } from 'react'
import { HashRouter, Route, Routes, useLocation } from 'react-router-dom'
import { PillNav } from './components/PillNav'
import { Brand } from './components/Brand'
import { ScrollProgress } from './components/ScrollProgress'
import { TopControls } from './components/TopControls'
import { BackToTop } from './components/BackToTop'
import { PortfolioPage } from './pages/PortfolioPage'
import { BlogsPage } from './pages/BlogsPage'
import { ArticlePage } from './pages/ArticlePage'

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
          <Routes>
            <Route path="/" element={<PortfolioPage />} />
            <Route path="/blogs" element={<BlogsPage />} />
            <Route path="/article/:slug" element={<ArticlePage />} />
          </Routes>
        </main>

        <footer className="topnav">
          <PillNav />
        </footer>
      </div>
    </HashRouter>
  )
}
