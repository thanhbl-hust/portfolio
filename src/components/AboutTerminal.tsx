import { useState } from 'react'
import { createPortal } from 'react-dom'

import { useModalDismiss } from '../hooks/useModalDismiss'

type Token = { text: string; cls?: string }
type Line = Token[]
type FileKey = 'about' | 'role'

const FILES: Record<FileKey, { label: string; filename: string; lines: Line[]; showCursor: boolean }> = {
  about: {
    label: '~/about.sh',
    filename: 'about.sh',
    showCursor: true,
    lines: [
      [{ text: '#!/bin/bash', cls: 'tok-comment' }],
      [],
      [
        { text: 'export', cls: 'tok-keyword' },
        { text: ' USER=' },
        { text: '"Lam Thanh Bui"', cls: 'tok-string' },
      ],
      [],
      [
        { text: 'echo', cls: 'tok-keyword' },
        { text: ' ' },
        { text: '"$USER - DevOps engineer who loves building things and craves knowledge"', cls: 'tok-string' },
      ],
    ],
  },
  role: {
    label: 'role.md',
    filename: 'role.md',
    showCursor: false,
    lines: [
      [
        { text: '# ', cls: 'tok-heading-mark' },
        { text: 'Role', cls: 'tok-heading' },
      ],
      [],
      [{ text: 'DevOps Engineer in Hanoi', cls: 'tok-heading' }],
    ],
  },
}

const FILE_KEYS = Object.keys(FILES) as FileKey[]

export function AboutTerminal() {
  const [active, setActive] = useState<FileKey>('about')
  const [photoOpen, setPhotoOpen] = useState(false)
  useModalDismiss(photoOpen, setPhotoOpen)

  return (
    <div className="terminal">
      <div className="terminal__tabs">
        {FILE_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            className={`terminal__tab${key === active ? ' terminal__tab--active' : ''}`}
            onClick={() => setActive(key)}
          >
            {FILES[key].label}
          </button>
        ))}
      </div>

      <div className="terminal__body">
        <button
          type="button"
          className="terminal__avatar"
          onClick={() => setPhotoOpen(true)}
          aria-label="Open full photo"
        >
          <img src="avatar-64.webp" alt="Bui Lam Thanh" width={64} height={64} decoding="async" />
        </button>

        {/* Every file is rendered and stacked in the same grid cell, so the body
          * keeps the height of the tallest one instead of collapsing when you
          * switch tabs. */}
        {FILE_KEYS.map((key) => {
          const file = FILES[key]
          const lastLineIndex = file.lines.length - 1
          return (
            <div
              key={key}
              className={`terminal__pane${key === active ? '' : ' terminal__pane--hidden'}`}
              aria-hidden={key !== active}
            >
              {file.lines.map((line, i) => (
                <div className="terminal__line" key={i}>
                  <span className="terminal__lineno">{i + 1}</span>
                  <span className="terminal__code">
                    {line.length === 0
                      ? ' '
                      : line.map((token, j) => (
                        <span key={j} className={token.cls}>
                          {token.text}
                        </span>
                      ))}
                    {file.showCursor && i === lastLineIndex && <span className="terminal__cursor" />}
                  </span>
                </div>
              ))}
            </div>
          )
        })}
      </div>

      <div className="terminal__statusbar">
        <span className="terminal__filename">{FILES[active].filename}</span>
      </div>

      {/* The full photo goes through a portal: .terminal clips its overflow and
        * grows a transform on hover, and either one would trap a fixed overlay
        * inside the card. It is only mounted while open so the full-size image
        * is not downloaded until someone asks for it. */}
      {photoOpen &&
        createPortal(
          <div
            className="photo-lightbox"
            role="dialog"
            aria-modal="true"
            aria-label="Bui Lam Thanh"
            tabIndex={-1}
            ref={(node) => {
              node?.focus()
            }}
            onClick={() => setPhotoOpen(false)}
          >
            <img
              src="avatar.jpg"
              alt="Bui Lam Thanh"
              className="photo-lightbox__image"
              onClick={(event) => event.stopPropagation()}
            />
          </div>,
          document.body,
        )}
    </div>
  )
}
