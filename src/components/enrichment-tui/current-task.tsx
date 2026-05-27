import React from 'react'
import { Text } from 'ink'
import { type CurrentMpn } from '@/lib/enrichment/observability/dashboard-state'

interface Props {
  current: CurrentMpn | null
}

export function CurrentTask({ current }: Props) {
  if (!current) return <Text dimColor>Ожидание...</Text>
  const started = new Date(current.startedAt).toLocaleTimeString('ru-RU', {
    hour12: false,
  })
  return (
    <Text>
      ▶ {current.mpn}  {current.brand}  старт {started}
    </Text>
  )
}
