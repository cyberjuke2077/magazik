const STATUS_META: Record<string, { label: string; cls: string }> = {
  new: { label: 'Новая', cls: 'bg-amber-100 text-amber-800' },
  in_progress: { label: 'В работе', cls: 'bg-blue-100 text-blue-800' },
  quoted: { label: 'КП отправлено', cls: 'bg-green-100 text-green-800' },
  rejected: { label: 'Отклонена', cls: 'bg-gray-100 text-gray-600' },
}

export function RequestStatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? { label: status, cls: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${meta.cls}`}>
      {meta.label}
    </span>
  )
}

export const REQUEST_STATUS_OPTIONS = [
  { value: 'new', label: 'Новая' },
  { value: 'in_progress', label: 'В работе' },
  { value: 'quoted', label: 'КП отправлено' },
  { value: 'rejected', label: 'Отклонена' },
] as const
