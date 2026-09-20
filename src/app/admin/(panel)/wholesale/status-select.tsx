'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateWholesaleStatus } from '../../actions'

export function WholesaleStatusSelect({ id, current }: { id: string; current: string }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const router = useRouter()
  return <div><select value={current} aria-label="Статус оптовой заявки" disabled={pending}
    onChange={(event) => {
      const status = event.target.value
      setError('')
      startTransition(async () => {
        try {
          const result = await updateWholesaleStatus(id, status)
          if (!result.ok) setError(result.error ?? 'Ошибка изменения статуса')
          router.refresh()
        } catch { setError('Связь прервалась. Повторите изменение статуса.') }
      })
    }} className="rounded border p-2">
    <option value="new">Новая</option><option value="in_progress">В работе</option><option value="closed">Закрыта</option>
  </select>{error && <p role="alert" className="text-red-700">{error}</p>}</div>
}
