import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import type { Plugin } from 'vite'

/** Grammars the blog actually writes code in. The name is the label you put on
 * a ``` fence; add one here and it starts highlighting. */
const HIGHLIGHT_LANGUAGES = [
  'bash',
  'shell',
  'yaml',
  'json',
  'dockerfile',
  'python',
  'go',
  'sql',
  'ini',
  'diff',
]

/**
 * rehype-highlight falls back to lowlight's `common` grammar set - 35 languages
 * of which this site uses two - and the fallback is written as
 * `settings.languages || common`, so the import is unconditional and no bundler
 * can shake it out. Swapping the module for a subset is the only way to pay for
 * just what we use.
 *
 * If lowlight ever moves this file the id stops matching, the real module loads
 * and the bundle simply goes back to the full set: it fails open.
 */
function lowlightSubset(): Plugin {
  return {
    name: 'lowlight-subset',
    enforce: 'pre',
    load(id) {
      if (!id.replace(/\\/g, '/').endsWith('/lowlight/lib/common.js')) return null
      const imports = HIGHLIGHT_LANGUAGES.map(
        (lang) => `import ${lang} from 'highlight.js/lib/languages/${lang}'`,
      ).join('\n')
      return `${imports}\nexport const grammars = { ${HIGHLIGHT_LANGUAGES.join(', ')} }\n`
    },
  }
}

/** The CV is the PDF in public/cv/ - the most recently modified one, if there
 * are several, and only an actual file (a folder named "x.pdf" matched the
 * extension check too). It is looked up when the config loads, so a file
 * dropped in while the dev server runs needs a restart. No file, no button:
 * the site never links to a PDF that isn't there. */
function findCv(): string | null {
  try {
    const dir = fileURLToPath(new URL('./public/cv', import.meta.url))
    const pdfs = readdirSync(dir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.pdf'))
      .map((entry) => ({ name: entry.name, modified: statSync(join(dir, entry.name)).mtimeMs }))
      .sort((a, b) => b.modified - a.modified)
    return pdfs[0]?.name ?? null
  } catch {
    return null
  }
}

// base: './' makes built asset paths relative so the site works when
// deployed under any GitHub Pages project subpath without configuration.
export default defineConfig({
  base: './',
  plugins: [react(), lowlightSubset()],
  define: {
    __CV_FILE__: JSON.stringify(findCv()),
  },
  build: {
    // Vite inlines assets under 4 KB into whatever imports them. For fonts that
    // put the small subsets (Vietnamese, Cyrillic) into the stylesheet as
    // base64 - half of it - which every visitor downloaded before the first
    // paint, whether the page had such text or not. As files, the browser
    // fetches a subset only for text that needs it (unicode-range).
    assetsInlineLimit: (file) => (/\.woff2?$/.test(file) ? false : undefined),
  },
})
