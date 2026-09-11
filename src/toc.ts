import GithubSlugger from 'github-slugger'

export interface TocItem {
  id: string
  text: string
  level: 2 | 3
  children: TocItem[]
}

const HEADING_RE = /^(#{2,3})\s+(.+)$/
const FENCE_RE = /^ {0,3}(`{3,}|~{3,})/
const LINE_RE = /\r?\n/

/**
 * Extracts H2/H3 headings from raw markdown and nests H3s under the
 * preceding H2, using the same slug algorithm rehype-slug applies to the
 * rendered headings so TOC links (#id) match the actual anchors.
 *
 * Fenced code is skipped. A post that documents Markdown itself shows
 * `## Heading` inside a code block, and those lines are examples, not
 * headings - rehype-slug never gives them an anchor to link to.
 */
export function buildToc(markdown: string): TocItem[] {
  const slugger = new GithubSlugger()
  const toc: TocItem[] = []
  let currentH2: TocItem | undefined
  /** The fence that opened the code block we are inside, if any. */
  let openFence: string | undefined

  for (const line of markdown.split(LINE_RE)) {
    const fence = line.match(FENCE_RE)?.[1]
    if (fence) {
      if (!openFence) {
        openFence = fence
      } else if (fence[0] === openFence[0] && fence.length >= openFence.length) {
        // A closing fence has to be at least as long as the one that opened the
        // block, which is what lets a ```` block hold a ``` example inside it.
        openFence = undefined
      }
      continue
    }
    if (openFence) continue

    const match = line.match(HEADING_RE)
    if (!match) continue

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
