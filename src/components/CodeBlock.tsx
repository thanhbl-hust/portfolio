import { useRef, useState } from 'react'
import type { ComponentPropsWithoutRef } from 'react'

type CodeBlockProps = ComponentPropsWithoutRef<'pre'> & { node?: unknown }

export function CodeBlock({ node: _node, children, ...rest }: CodeBlockProps) {
  const preRef = useRef<HTMLPreElement>(null)
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    const text = preRef.current?.textContent ?? ''
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard unavailable (insecure context, permission denied) - button just won't confirm
    }
  }

  return (
    <div className="code-block">
      <pre ref={preRef} {...rest}>
        {children}
      </pre>
      <button type="button" className="code-block__copy" onClick={handleCopy}>
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  )
}
