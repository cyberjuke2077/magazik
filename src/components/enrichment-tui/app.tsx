import React, { useSyncExternalStore } from 'react'
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
  const state = useDashboardState(stateApi)
  const modeLabel = mode === 'live' ? 'запуск' : mode === 'watch' ? 'наблюдение' : 'снимок'
  const phaseLabel = formatPhase(state.phase)

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color="cyan">
        ПАРСЕР КАТАЛОГА - {modeLabel}
      </Text>
      <Text>
        Запуск: {state.runId ?? 'подготовка'} | Этап: {phaseLabel}
      </Text>
      <ProgressBar
        processed={state.processedInQueue}
        total={state.totalInQueue}
      />
      <Text>
        Осталось обработать: {state.excelRemaining} из {state.excelTotal}
      </Text>
      <CurrentTask current={state.currentMpn} />
      <StatusCounters counts={state.statusCounts} />
      <Text>
        Лимит Mouser: {state.mouserQuota.used} из {state.mouserQuota.limit}
      </Text>
      <EventLog events={state.recentEvents.toArray()} />
      {state.helpVisible && (
        <Text color="yellow">
          Остановка безопасна: текущий результат сохранится, затем запуск можно продолжить.
        </Text>
      )}
      <Text dimColor>q или Ctrl+C: безопасно остановить | ?: помощь</Text>
    </Box>
  )
}

function useDashboardState(stateApi: DashboardStateAPI) {
  useSyncExternalStore(
    stateApi.subscribe,
    stateApi.getVersion,
    stateApi.getVersion,
  )

  return stateApi.getState()
}

function formatPhase(phase: ReturnType<DashboardStateAPI['getState']>['phase']): string {
  if (phase === 'chipdip-queue') return 'ChipDip'
  if (phase === 'lcsc-queue') return 'LCSC'
  if (phase === 'mouser-queue') return 'Mouser'
  if (phase === 'shutting-down') return 'безопасная остановка'
  return 'подготовка'
}
