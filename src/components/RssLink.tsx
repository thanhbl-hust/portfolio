export function RssLink() {
  return (
    <a href="rss.xml" className="rss-link" target="_blank" rel="noopener noreferrer" aria-label="RSS feed">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="5" cy="19" r="1.5" />
        <path d="M4 11a9 9 0 0 1 9 9" />
        <path d="M4 4a16 16 0 0 1 16 16" />
      </svg>
    </a>
  )
}
