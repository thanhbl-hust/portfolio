/** How a dynamic import of a missing file is worded - by Chromium, Firefox and
 * Safari, and by Vite when a chunk's CSS fails to preload. */
const MISSING_CHUNK = /dynamically imported module|Importing a module script failed|Unable to preload CSS/i
const RELOADED_AT = 'stale-build-reload'

/**
 * Every deploy replaces the site's hashed files, so a tab opened before one
 * asks for chunks that no longer exist the next time it changes page. A reload
 * picks up the new build. At most once per ten seconds, so a chunk that is
 * genuinely missing ends on the error page instead of reloading forever.
 */
export function reloadIfStaleBuild(error: unknown) {
  if (!(error instanceof Error) || !MISSING_CHUNK.test(error.message)) return
  try {
    const last = Number(sessionStorage.getItem(RELOADED_AT))
    if (Date.now() - last < 10_000) return
    sessionStorage.setItem(RELOADED_AT, String(Date.now()))
  } catch {
    // No storage means no loop guard; leave it to the page's Reload button.
    return
  }
  window.location.reload()
}
