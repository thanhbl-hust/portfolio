import { Link } from 'react-router-dom'

export function Brand() {
  return (
    <Link to="/" className="brand" aria-label="Go to Portfolio">
      <span className="brand__icon">{'</>'}</span>
      <span>thanhbl.io</span>
    </Link>
  )
}
