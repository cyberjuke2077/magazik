'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { loadRequestHistory, REQUEST_HISTORY_KEY, type SavedRequest } from '@/lib/request-history'

export function AccountClient() {
  const [requests, setRequests] = useState<SavedRequest[]>([])
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    // Browser-only history becomes available after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRequests(loadRequestHistory())
    setReady(true)
  }, [])
  return <div className="mx-auto max-w-3xl px-4 py-12">
    <h1 className="text-3xl font-bold">Ваши заявки</h1>
    <p className="my-4 text-ink-3">Последние заявки, отправленные из этого браузера. Ссылки позволяют проверить статус без регистрации. Сохраните нужные ссылки перед очисткой истории.</p>
    {!ready ? <p>Загрузка...</p> : requests.length ? <ul className="space-y-3">{requests.map((request) =>
      <li key={request.id} className="rounded border p-4 break-all"><Link className="text-azure underline" href={`/request-quote/status/${request.id}`}>
        Заявка {request.id}</Link><p className="text-sm">{new Date(request.createdAt).toLocaleDateString('ru-RU')}</p></li>)}</ul>
      : <p className="my-6">В этом браузере ещё нет сохранённых заявок.</p>}
    {requests.length > 0 && <button className="my-4 underline" onClick={() => {
      try { localStorage.removeItem(REQUEST_HISTORY_KEY); setRequests([]) }
      catch { setError('Не удалось очистить историю браузера') }
    }}>Очистить историю в этом браузере</button>}
    {error && <p role="alert">{error}</p>}
    <div className="mt-6 flex flex-wrap gap-4"><Link className="text-azure underline" href="/catalog">Выбрать компоненты</Link>
      <Link className="text-azure underline" href="/wholesale#request-form">Отправить список MPN</Link></div>
  </div>
}
