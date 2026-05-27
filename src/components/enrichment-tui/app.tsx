import React from 'react'
import { Box, Text } from 'ink'
import { type DashboardStateAPI } from '@/lib/enrichment/observability/dashboard-state'
import { type EnrichmentEvents } from '@/lib/enrichment/observability/event-bus'
import { ProgressBar } from './progress-bar'
import { CurrentTask } from './current-task'
import { StatusCounters } from './status-counters'
import { EventLog } from './event-log'
import { useHotkeys } from './hotkeys'

interface AppProps {
  mode: 'live' | 'watch' | 'snapshot'
  stateApi: DashboardStateAPI
  bus?: EnrichmentEvents
}

export function App({ mode, stateApi, bus }: AppProps) {
  useHotkeys({ mode, stateApi, bus })
  const state = stateApi.getState()
  return (
    <Box flexDirection="column" padding={1}>
      <Text bold>
        Enrichment {mode} — {state.runId ?? 'no run'} — {state.phase}
      </Text>
      <ProgressBar
        processed={state.processedInQueue}
        total={state.totalInQueue}
      />
      <Text>
        Осталось из Excel: {state.excelRemaining} / {state.excelTotal}
      </Text>
      <CurrentTask current={state.currentMpn} />
      <StatusCounters counts={state.statusCounts} />
      <Text>
        Mouser: {state.mouserQuota.used} / {state.mouserQuota.limit}
      </Text>
      <EventLog events={state.recentEvents.toArray()} />
      <Text dimColor>q: quit  p: pause  ?: help</Text>
    </Box>
  )
}
