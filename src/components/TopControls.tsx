import type { Ref } from 'react'
import { SocialLinks } from './SocialLinks'
import { ThemeToggle } from './ThemeToggle'

export function TopControls({ slotRef }: { slotRef: Ref<HTMLDivElement> }) {
  return (
    <div className="top-controls">
      {/* a page's own controls land here - see HeaderSlot */}
      <div className="top-controls__slot" ref={slotRef} />
      <SocialLinks />
      <ThemeToggle />
    </div>
  )
}
