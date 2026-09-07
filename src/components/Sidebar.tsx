import { NavLink } from 'react-router-dom'
import type { Article } from '../content'

interface SidebarProps {
  articles: Article[]
  isOpen: boolean
  onNavigate: () => void
}

export function Sidebar({ articles, isOpen, onNavigate }: SidebarProps) {
  return (
    <aside className={`sidebar${isOpen ? ' sidebar--open' : ''}`}>
      <nav className="sidebar__nav" aria-label="Site navigation">
        <NavLink
          to="/"
          end
          onClick={onNavigate}
          className={({ isActive }) => `sidebar__link sidebar__link--portfolio${isActive ? ' sidebar__link--active' : ''}`}
        >
          Portfolio
        </NavLink>
        <div className="sidebar__divider" role="separator" />
        <ul className="sidebar__list">
          {articles.map((article) => (
            <li key={article.slug}>
              <NavLink
                to={`/article/${article.slug}`}
                onClick={onNavigate}
                className={({ isActive }) => `sidebar__link${isActive ? ' sidebar__link--active' : ''}`}
              >
                {article.title}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}
