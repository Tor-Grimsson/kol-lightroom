import { useState } from 'react'

export default function CodeBlock({ children, language }) {
  const [copied, setCopied] = useState(false)

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(String(children))
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* clipboard blocked — silent */
    }
  }

  return (
    <div className="kol-codeblock">
      {language && <span className="kol-codeblock-lang">{language}</span>}
      <button
        type="button"
        className="kol-codeblock-copy"
        onClick={onCopy}
        aria-label={copied ? 'Copied' : 'Copy to clipboard'}
        title={copied ? 'Copied' : 'Copy'}
      >
        {copied ? (
          <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true">
            <path d="M5 10 L9 14 L15 6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true">
            <rect x="6" y="3" width="10" height="12" rx="1" fill="none" stroke="currentColor" strokeWidth="1.4" />
            <rect x="4" y="6" width="10" height="12" rx="1" fill="none" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        )}
        <span className="leading-none">{copied ? 'Copied' : 'Copy'}</span>
      </button>
      <pre><code>{children}</code></pre>
    </div>
  )
}
