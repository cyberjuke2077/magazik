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
  { key: 'chipdip_done', label: 'ChipDip ✓', color: 'green' },
  { key: 'chipdip_not_found', label: 'ChipDip ✗', color: 'red' },
  { key: 'chipdip_blocked', label: 'ChipDip ⚠', color: 'yellow' },
  { key: 'lcsc_done', label: 'LCSC ✓', color: 'green' },
  { key: 'lcsc_not_found', label: 'LCSC ✗', color: 'red' },
  { key: 'mouser_done', label: 'Mouser ✓', color: 'green' },
  { key: 'mouser_not_found', label: 'Mouser ✗', color: 'red' },
  { key: 'unresolved', label: 'unresolved', color: 'red' },
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
