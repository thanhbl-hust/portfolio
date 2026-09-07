import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const contentDir = join(__dirname, '..', 'content')
const distDir = join(__dirname, '..', 'dist')

const SITE_URL = 'https://thanhbl-hust.github.io/portfolio'
const SITE_TITLE = 'Technical Notes'
const SITE_DESCRIPTION = 'Technical notes, tutorials, and a portfolio by Bui Lam Thanh — DevOps Engineer.'
const EXCERPT_MAX_LENGTH = 160

// Mirrors the parsing in src/content.ts, but Node-side (no DOM) since this
// runs as a build script rather than in the browser bundle.
function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!match) return { data: {}, body: raw }
  const [, frontmatter, body] = match
  const data = {}
  for (const line of frontmatter.split(/\r?\n/)) {
    const lineMatch = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/)
    if (!lineMatch) continue
    const [, key, rawValue] = lineMatch
    data[key] = rawValue.trim().replace(/^["']|["']$/g, '')
  }
  return { data, body }
}

function titleFromBody(body) {
  return body.match(/^#\s+(.+)$/m)?.[1]?.trim()
}

// Node has no DOM to lean on for entity decoding (unlike src/content.ts in
// the browser bundle), so cover the handful of named entities this content
// actually uses plus the standard XML ones.
const NAMED_ENTITIES = {
  mdash: '—',
  ndash: '–',
  hellip: '…',
  middot: '·',
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
}

function decodeHtmlEntities(text) {
  return text.replace(/&([a-zA-Z]+|#\d+|#x[0-9a-fA-F]+);/g, (match, entity) => {
    if (entity[0] === '#') {
      const code = entity[1] === 'x' || entity[1] === 'X' ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10)
      return Number.isNaN(code) ? match : String.fromCodePoint(code)
    }
    return NAMED_ENTITIES[entity] ?? match
  })
}

function extractExcerpt(body) {
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

function toRfc822(dateStr) {
  const date = dateStr ? new Date(`${dateStr}T00:00:00Z`) : new Date()
  return Number.isNaN(date.getTime()) ? new Date().toUTCString() : date.toUTCString()
}

const articles = readdirSync(contentDir)
  .filter((filename) => filename.endsWith('.md'))
  .map((filename) => {
    const raw = readFileSync(join(contentDir, filename), 'utf-8')
    const { data, body } = parseFrontmatter(raw)
    return {
      slug: filename.replace(/\.md$/, ''),
      title: data.title ?? titleFromBody(body) ?? filename,
      date: data.date ?? '',
      excerpt: extractExcerpt(body),
    }
  })
  .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.title.localeCompare(b.title)))

const items = articles
  .map((article) => {
    const url = `${SITE_URL}/#/article/${article.slug}`
    return `    <item>
      <title><![CDATA[${article.title}]]></title>
      <link>${url}</link>
      <guid isPermaLink="false">${url}</guid>
      <pubDate>${toRfc822(article.date)}</pubDate>
      <description><![CDATA[${article.excerpt}]]></description>
    </item>`
  })
  .join('\n')

const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${SITE_TITLE}</title>
    <link>${SITE_URL}/</link>
    <description>${SITE_DESCRIPTION}</description>
    <language>en</language>
${items}
  </channel>
</rss>
`

writeFileSync(join(distDir, 'rss.xml'), rss, 'utf-8')
console.log(`generate-rss: wrote rss.xml with ${articles.length} articles`)
