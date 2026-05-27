import React from 'react'
import { Box, Text } from 'ink'

interface Props {
  processed: number
  total: number
}

export function ProgressBar({ processed, total }: Props) {
  const pct = total > 0 ? Math.round((processed / total) * 100) : 0
  const width = 30
  const filled = Math.round((pct / 100) * width)
  const bar = '█'.repeat(filled) + '░'.repeat(width - filled)
  return (
    <Box>
      <Text>
        {bar} {processed}/{total} ({pct}%)
      </Text>
    </Box>
  )
}
