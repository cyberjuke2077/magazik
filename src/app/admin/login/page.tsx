'use client'

import { useActionState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Lock } from 'lucide-react'
import { loginAdmin } from './actions'

function LoginForm() {
  const searchParams = useSearchParams()
  const from = searchParams.get('from') ?? '/admin'
  const [state, formAction, pending] = useActionState(loginAdmin, null)

  return (
    <form action={formAction} className="w-full max-w-sm space-y-4">
      <div className="flex flex-col items-center gap-2 mb-6">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-100">
          <Lock className="w-5 h-5 text-gray-600" />
        </div>
        <h1 className="text-xl font-semibold text-gray-900">Админ-панель</h1>
        <p className="text-sm text-gray-500">Electromagaz</p>
      </div>

      <input type="hidden" name="from" value={from} />
      <input
        type="text"
        name="username"
        aria-label="Логин"
        placeholder="Логин"
        autoComplete="username"
        autoFocus
        required
        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400"
      />
      <input
        type="password"
        name="password"
        aria-label="Пароль"
        placeholder="Пароль"
        autoComplete="current-password"
        required
        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400"
      />

      {state?.error && (
        <p className="text-sm text-red-600 text-center">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
      >
        {pending ? 'Проверка…' : 'Войти'}
      </button>
    </form>
  )
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  )
}
