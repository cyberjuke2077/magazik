'use client'

import { useState, useCallback } from 'react'
import { Link2 } from 'lucide-react'

export function CopyLinkBtn() {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const input = document.createElement('input')
      input.value = window.location.href
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [])

  return (
    <div className="relative">
      <button
        onClick={handleCopy}
        className="flex items-center justify-center h-8 w-8 text-ink-4 hover:text-ink-3 border border-[var(--border)] rounded hover:border-azure/40 transition-colors"
        title="Скопировать ссылку"
      >
        <Link2 size={14} />
      </button>

      {copied && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs font-medium text-white bg-gray-800 rounded whitespace-nowrap">
          Скопировано!
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
        </div>
      )}
    </div>
  )
}
