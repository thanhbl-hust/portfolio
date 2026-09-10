import { Link } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export function NotFoundPage() {
  useDocumentTitle('Page not found')

  return (
    <section className="notfound">
      <p className="notfound__code">404</p>
      <h1 className="notfound__title">Page not found</h1>
      <p className="notfound__body">
        That address doesn&rsquo;t match anything on this site. It may have been renamed, or the
        link that brought you here may be out of date.
      </p>
      <p className="notfound__links">
        <Link to="/">Portfolio</Link> <span aria-hidden="true">·</span>{' '}
        <Link to="/blogs">All blog posts</Link>
      </p>
    </section>
  )
}
