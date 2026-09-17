'use client'

import { useEffect } from 'react'
import { watchSubmissionStateExpiry } from '@/lib/submission-key'

const SUBMISSION_SCOPES = ['quote', 'wholesale'] as const

export function SubmissionStateExpiryGuard() {
  useEffect(() => {
    const stopWatching = SUBMISSION_SCOPES.map(watchSubmissionStateExpiry)
    return () => stopWatching.forEach((stop) => stop())
  }, [])

  return null
}
