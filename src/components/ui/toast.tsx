'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { Check, X, AlertCircle, Info } from 'lucide-react'

type ToastVariant = 'success' | 'error' | 'info'

interface Toast {
  id: string
  message: string
  variant: ToastVariant
  action?: {
    label: string
    href: string
  }
}

interface ToastContextValue {
  toast: (message: string, options?: { variant?: ToastVariant; action?: Toast['action'] }) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    // Fallback: no provider mounted (e.g. during SSR or in tests)
    return {
      toast: (msg: string) => {
        if (typeof window !== 'undefined') console.info('[toast]', msg)
      },
    }
  }
  return ctx
}

const variantStyles: Record<ToastVariant, { bg: string; icon: React.ReactNode }> = {
  success: {
    bg: 'border-green-200 bg-green-50',
    icon: <Check size={16} className="text-green-600" />,
  },
  error: {
    bg: 'border-red-200 bg-red-50',
    icon: <AlertCircle size={16} className="text-red-600" />,
  },
  info: {
    bg: 'border-blue-200 bg-blue-50',
    icon: <Info size={16} className="text-azure" />,
  },
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback<ToastContextValue['toast']>((message, options) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    setToasts((prev) => [
      ...prev,
      { id, message, variant: options?.variant ?? 'success', action: options?.action },
    ])
    // Auto-dismiss after 4s
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast viewport - bottom right */}
      <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 max-w-sm w-[calc(100vw-2rem)] sm:w-auto pointer-events-none">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Trigger entrance animation
    const t = setTimeout(() => setShow(true), 10)
    return () => clearTimeout(t)
  }, [])

  const v = variantStyles[toast.variant]

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 min-w-[280px] sm:min-w-[340px] p-4 border rounded shadow-lg bg-white ${v.bg} transition-all duration-300 ${
        show ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
      }`}
      role="status"
    >
      <div className="shrink-0 mt-0.5">{v.icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900 leading-snug">{toast.message}</div>
        {toast.action && (
          <a
            href={toast.action.href}
            className="inline-block mt-2 text-xs font-semibold text-azure hover:text-azure-hover underline"
          >
            {toast.action.label}
          </a>
        )}
      </div>
      <button
        onClick={onDismiss}
        className="shrink-0 text-gray-400 hover:text-gray-700 transition-colors"
        aria-label="Закрыть"
      >
        <X size={14} />
      </button>
    </div>
  )
}
