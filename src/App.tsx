import { useEffect, useState } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { Sidebar } from './components/Sidebar'
import { PortfolioPage } from './pages/PortfolioPage'
import { ArticlePage } from './pages/ArticlePage'
import { articles } from './content'

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  return (
    <HashRouter>
      <div className="layout">
        <button
          type="button"
          className="menu-toggle"
          aria-expanded={menuOpen}
          aria-controls="sidebar"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? 'Close' : 'Menu'}
        </button>

        {menuOpen && <div className="sidebar-overlay" onClick={() => setMenuOpen(false)} />}

        <Sidebar articles={articles} isOpen={menuOpen} onNavigate={() => setMenuOpen(false)} />

        <main className="content">
          <Routes>
            <Route path="/" element={<PortfolioPage />} />
            <Route path="/article/:slug" element={<ArticlePage />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  )
}
