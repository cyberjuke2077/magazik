import { useInput, useApp } from 'ink'
import { type DashboardStateAPI } from '@/lib/enrichment/observability/dashboard-state'
import { type EnrichmentEvents } from '@/lib/enrichment/observability/event-bus'

interface Props {
  mode: 'live' | 'watch' | 'snapshot'
  stateApi: DashboardStateAPI
  bus?: EnrichmentEvents
}

export function useHotkeys({ mode, stateApi, bus }: Props) {
  const { exit } = useApp()

  const handleQuit = () => {
    if (mode === 'live' && bus) {
      bus.emit('shutdown_initiated', {
        source: 'hotkey',
        timestamp: Date.now(),
      })
      return
    }
    exit()
  }

  useInput((input, key) => {
    if (key.ctrl && input === 'c') {
      handleQuit()
      return
    }
    if (input === 'q') {
      handleQuit()
      return
    }
    if (input === '?') {
      stateApi.toggleHelp()
      return
    }
  })
}
