export interface Article {
  slug: string
  title: string
  date: string
  tag: string
  /** Language of the body text, for its `lang` attribute: 'vi' or 'en'. */
  lang: string
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

/** Letters Vietnamese has and English doesn't - ă â đ ê ô ơ ư and the
 * tone-marked vowels. One of them anywhere and a post counts as Vietnamese,
 * unless its frontmatter sets `lang` itself. */
const VIETNAMESE_LETTERS = /[ăâđêôơưĂÂĐÊÔƠƯẠ-ỹ]/

/** "2026-09-08" as "Sep 8, 2026" - how dates read everywhere on the site. */
export function formatDate(iso: string): string {
  if (!iso) return ''
  const date = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
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
      lang: data.lang || (VIETNAMESE_LETTERS.test(body) ? 'vi' : 'en'),
      excerpt: extractExcerpt(body),
      body,
    }
  })
  // Newest first, matching the RSS feed. Undated drafts sink to the bottom.
  .sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title))

export function getArticle(slug: string): Article | undefined {
  return articles.find((article) => article.slug === slug)
}

export interface TagGroup {
  tag: string
  articles: Article[]
}

/** Where posts without a tag are filed. */
const UNTAGGED = 'Other'

/** The blog index, a section per tag: the tags with the most posts first (ties
 * alphabetical), untagged posts last, newest first within each. Tags match
 * regardless of case, so "docker" and "Docker" end up together. */
function groupByTag(list: Article[]): TagGroup[] {
  const groups = new Map<string, TagGroup>()
  for (const article of list) {
    const tag = article.tag || UNTAGGED
    const group = groups.get(tag.toLowerCase())
    if (group) group.articles.push(article)
    else groups.set(tag.toLowerCase(), { tag, articles: [article] })
  }
  return [...groups.values()].sort(
    (a, b) =>
      Number(a.tag === UNTAGGED) - Number(b.tag === UNTAGGED) ||
      b.articles.length - a.articles.length ||
      a.tag.localeCompare(b.tag),
  )
}

export const articleGroups = groupByTag(articles)

/** FNV-1a, used to turn a slug into a shuffle seed. */
function hashSeed(text: string): number {
  let hash = 2166136261
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

/** Shuffled, but seeded rather than random: each article gets its own order and
 * keeps it. `Math.random()` here would re-pick the suggestions on every render,
 * so they visibly swapped around while reading. */
function seededShuffle<T>(items: T[], seed: number): T[] {
  const copy = [...items]
  let state = seed || 1
  for (let i = copy.length - 1; i > 0; i -= 1) {
    state = (Math.imul(state, 1103515245) + 12345) >>> 0
    const j = state % (i + 1)
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/** Suggests other articles to read next: same-tag articles first, topped up
 * from the rest if there aren't enough. Stable for a given article. */
export function getSuggestedArticles(slug: string, count = 2): Article[] {
  const current = getArticle(slug)
  if (!current) return []

  const others = articles.filter((article) => article.slug !== slug)
  const sameTag = current.tag ? others.filter((article) => article.tag === current.tag) : []
  const rest = others.filter((article) => !sameTag.includes(article))

  const seed = hashSeed(slug)
  return [...seededShuffle(sameTag, seed), ...seededShuffle(rest, seed)].slice(0, count)
}
