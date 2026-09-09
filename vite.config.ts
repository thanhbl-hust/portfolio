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

// base: './' makes built asset paths relative so the site works when
// deployed under any GitHub Pages project subpath without configuration.
export default defineConfig({
  base: './',
  plugins: [react(), lowlightSubset()],
})
