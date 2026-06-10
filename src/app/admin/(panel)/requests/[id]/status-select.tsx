'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateRequestStatus, type RequestStatus } from '../../../actions'
import { REQUEST_STATUS_OPTIONS } from '../status-badge'

export function RequestStatusSelect({
  requestId,
  current,
}: {
  requestId: string
  current: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  return (
    <select
      defaultValue={current}
      disabled={pending}
      onChange={(e) => {
        const status = e.target.value as RequestStatus
        startTransition(async () => {
          const res = await updateRequestStatus(requestId, status)
          if (!res.ok) alert(res.error ?? 'Не удалось обновить статус')
          router.refresh()
        })
      }}
      className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/10 disabled:opacity-50"
    >
      {REQUEST_STATUS_OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}
