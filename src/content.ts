export interface Article {
  slug: string
  title: string
  date: string
  tag: string
  excerpt: string
  body: string
}

/**
 * Minimal frontmatter parser. Supports:
 * ---
 * title: "Some Title"
 * date: "2026-09-07"
 * ---
 * ...markdown body...
 *
 * Avoids pulling in gray-matter (Node Buffer dependency) since this runs
 * fully in the browser bundle.
 */
function parseFrontmatter(raw: string): { data: Record<string, string>; body: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!match) {
    return { data: {}, body: raw }
  }
  const [, frontmatter, body] = match
  const data: Record<string, string> = {}
  for (const line of frontmatter.split(/\r?\n/)) {
    const lineMatch = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/)
    if (!lineMatch) continue
    const [, key, rawValue] = lineMatch
    const value = rawValue.trim().replace(/^["']|["']$/g, '')
    data[key] = value
  }
  return { data, body }
}

function slugFromPath(path: string): string {
  const filename = path.split('/').pop() ?? path
  return filename.replace(/\.md$/, '')
}

function titleFromBody(body: string): string | undefined {
  const match = body.match(/^#\s+(.+)$/m)
  return match?.[1]?.trim()
}

const EXCERPT_MAX_LENGTH = 160

/** Plain-text summary for blog list cards: the first prose paragraph, with
 * markdown syntax stripped and headings/code fences/tables/quotes skipped. */
function extractExcerpt(body: string): string {
  let paragraph = ''
  for (const rawLine of body.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line) {
      if (paragraph) break
      continue
    }
    if (/^(#{1,6}\s|```|>|\||!\[)/.test(line)) {
      if (paragraph) break
      continue
    }
    paragraph += (paragraph ? ' ' : '') + line
  }

  const plain = decodeHtmlEntities(
    paragraph
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'),
  ).trim()

  return plain.length > EXCERPT_MAX_LENGTH ? `${plain.slice(0, EXCERPT_MAX_LENGTH).trimEnd()}…` : plain
}

/** Markdown allows raw HTML entities (e.g. &mdash;) inline; decode them for
 * the plain-text excerpt since it bypasses the normal markdown-to-HTML render. */
function decodeHtmlEntities(text: string): string {
  const el = document.createElement('textarea')
  el.innerHTML = text
  return el.value
}

const rawModules = import.meta.glob('/content/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

export const articles: Article[] = Object.entries(rawModules)
  .map(([path, raw]) => {
    const { data, body } = parseFrontmatter(raw)
    const slug = slugFromPath(path)
    return {
      slug,
      title: data.title ?? titleFromBody(body) ?? slug,
      date: data.date ?? '',
      tag: data.tag ?? '',
      excerpt: extractExcerpt(body),
      body,
    }
  })
  .sort((a, b) => a.tag.localeCompare(b.tag) || a.title.localeCompare(b.title))

export function getArticle(slug: string): Article | undefined {
  return articles.find((article) => article.slug === slug)
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/** Suggests other articles to read next: same-tag articles first (shuffled),
 * topped up with random picks from the rest if there aren't enough. */
export function getSuggestedArticles(slug: string, count = 2): Article[] {
  const current = getArticle(slug)
  if (!current) return []

  const others = articles.filter((article) => article.slug !== slug)
  const sameTag = current.tag ? others.filter((article) => article.tag === current.tag) : []
  const rest = others.filter((article) => !sameTag.includes(article))

  return [...shuffle(sameTag), ...shuffle(rest)].slice(0, count)
}
