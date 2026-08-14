import React from 'react'
import { Box, Text } from 'ink'
import { type EnrichmentJournalStatus } from '@/lib/enrichment/observability/event-bus'

interface Props {
  counts: Record<EnrichmentJournalStatus, number>
}

const DISPLAY: Array<{
  key: EnrichmentJournalStatus
  label: string
  color?: string
}> = [
  { key: 'chipdip_done', label: 'ChipDip найдено', color: 'green' },
  { key: 'chipdip_not_found', label: 'ChipDip не найдено', color: 'red' },
  { key: 'chipdip_blocked', label: 'ChipDip заблокировал', color: 'yellow' },
  { key: 'lcsc_done', label: 'LCSC найдено', color: 'green' },
  { key: 'lcsc_not_found', label: 'LCSC не найдено', color: 'red' },
  { key: 'mouser_done', label: 'Mouser найдено', color: 'green' },
  { key: 'mouser_not_found', label: 'Mouser не найдено', color: 'red' },
  { key: 'unresolved', label: 'Не найдено нигде', color: 'red' },
]

export function StatusCounters({ counts }: Props) {
  return (
    <Box flexDirection="column">
      {DISPLAY.map((d) => (
        <Text key={d.key} color={d.color}>
          {d.label} {counts[d.key] ?? 0}
        </Text>
      ))}
    </Box>
  )
}
