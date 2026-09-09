import { useState } from 'react'

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
        <img src="avatar.jpg" alt="Bui Lam Thanh" className="terminal__avatar" />

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
    </div>
  )
}
