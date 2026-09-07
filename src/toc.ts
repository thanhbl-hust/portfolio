import GithubSlugger from 'github-slugger'

export interface TocItem {
  id: string
  text: string
  level: 2 | 3
  children: TocItem[]
}

const HEADING_RE = /^(#{2,3})\s+(.+)$/gm

/**
 * Extracts H2/H3 headings from raw markdown and nests H3s under the
 * preceding H2, using the same slug algorithm rehype-slug applies to the
 * rendered headings so TOC links (#id) match the actual anchors.
 */
export function buildToc(markdown: string): TocItem[] {
  const slugger = new GithubSlugger()
  const toc: TocItem[] = []
  let currentH2: TocItem | undefined

  for (const match of markdown.matchAll(HEADING_RE)) {
    const level = match[1].length as 2 | 3
    const text = match[2].trim().replace(/`/g, '')
    const id = slugger.slug(text)
    const item: TocItem = { id, text, level, children: [] }

    if (level === 2) {
      toc.push(item)
      currentH2 = item
    } else if (currentH2) {
      currentH2.children.push(item)
    } else {
      toc.push(item)
    }
  }

  return toc
}

export function countHeadings(toc: TocItem[]): number {
  return toc.reduce((sum, item) => sum + 1 + item.children.length, 0)
}
