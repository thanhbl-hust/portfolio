import { NavLink, useLocation } from 'react-router-dom'

export function PillNav() {
  const { pathname } = useLocation()
  const isBlogsActive = pathname.startsWith('/blogs') || pathname.startsWith('/article/')

  return (
    <nav className="pill-nav" aria-label="Site navigation">
      <NavLink
        to="/"
        end
        className={({ isActive }) => `pill-nav__link${isActive ? ' pill-nav__link--active' : ''}`}
      >
        Portfolio
      </NavLink>
      <NavLink to="/blogs" className={`pill-nav__link${isBlogsActive ? ' pill-nav__link--active' : ''}`}>
        Blogs
      </NavLink>
    </nav>
  )
}
