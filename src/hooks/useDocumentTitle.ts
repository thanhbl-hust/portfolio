import { useEffect } from 'react'

const SITE_NAME = 'Technical Notes'

export function useDocumentTitle(pageTitle?: string) {
  useEffect(() => {
    document.title = pageTitle ? `${pageTitle} — ${SITE_NAME}` : SITE_NAME
  }, [pageTitle])
}
