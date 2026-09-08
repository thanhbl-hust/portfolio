import { GithubLink } from './GithubLink'
import { ThemeToggle } from './ThemeToggle'

export function TopControls() {
  return (
    <div className="top-controls">
      <GithubLink />
      <ThemeToggle />
    </div>
  )
}
