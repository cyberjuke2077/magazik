import React from 'react'
import { Box, Text } from 'ink'
import { type RecentEvent } from '@/lib/enrichment/observability/dashboard-state'

interface Props {
  events: RecentEvent[]
}

function icon(status: string): string {
  if (status.endsWith('_done') || status === 'done') return '✓'
  if (status.endsWith('_blocked') || status.endsWith('_failed')) return '⚠'
  return '✗'
}

function color(status: string): string | undefined {
  if (status.endsWith('_done') || status === 'done') return 'green'
  if (status.endsWith('_blocked') || status.endsWith('_failed')) return 'yellow'
  return 'red'
}

export function EventLog({ events }: Props) {
  return (
    <Box flexDirection="column" marginTop={1}>
      <Text bold>Лента событий:</Text>
      {events.slice(0, 16).map((e, i) => (
        <Text key={i} color={color(e.status)}>
          {icon(e.status)} {e.mpn}  {e.brand}  {e.status}
        </Text>
      ))}
    </Box>
  )
}
