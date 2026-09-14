import { NavLink, useLocation } from 'react-router-dom'

// The 3D scene is by far the heaviest chunk on the site (~245 KB gzipped), so it
// isn't prefetched on idle with the pages - only once someone heads for the
// Portfolio link. The import resolves to the same chunk the page lazy-loads; if
// it fails, the page's own import tries again.
const prefetchScene = () => {
  import('./PeopleScene').catch(() => {})
}

export function PillNav() {
  const { pathname } = useLocation()
  const isBlogsActive = pathname.startsWith('/blogs') || pathname.startsWith('/article/')

  return (
    <nav className="pill-nav" aria-label="Site navigation">
      <NavLink
        to="/"
        end
        onPointerEnter={prefetchScene}
        onFocus={prefetchScene}
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
