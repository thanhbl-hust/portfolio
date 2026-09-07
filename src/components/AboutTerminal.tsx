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
        { text: '"Bui Lam Thanh"', cls: 'tok-string' },
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
      [{ text: 'DevOps Engineer in Hanoi', cls: 'tok-heading' }],
    ],
  },
}

export function AboutTerminal() {
  const [active, setActive] = useState<FileKey>('about')
  const file = FILES[active]
  const lastLineIndex = file.lines.length - 1
  const lastLineLength = file.lines[lastLineIndex].reduce((sum, token) => sum + token.text.length, 0)

  return (
    <div className="terminal">
      <div className="terminal__tabs">
        {(Object.keys(FILES) as FileKey[]).map((key) => (
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

      <div className="terminal__statusbar">
        <span className="terminal__mode">NORMAL</span>
        <span className="terminal__filename">{file.filename}</span>
        <span className="terminal__pos">
          {lastLineIndex + 1}:{file.showCursor ? lastLineLength + 1 : 1}
        </span>
      </div>
    </div>
  )
}
