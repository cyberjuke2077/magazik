import type { SubmissionScope } from '@/lib/submission-rate-limit'

type SubmissionOutcome =
  | 'rejected_validation'
  | 'rejected_rate_limit'
  | 'saved'
  | 'failed'

interface SubmissionLogEvent {
  scope: SubmissionScope
  outcome: SubmissionOutcome
  durationMs: number
  requestId?: string
  errorType?: string
  notificationStatus?: 'sent' | 'not_configured' | 'failed'
}

export function serializeSubmissionLog(event: SubmissionLogEvent): string {
  return JSON.stringify({
    event: 'public_submission',
    scope: event.scope,
    outcome: event.outcome,
    durationMs: Math.max(0, Math.round(event.durationMs)),
    ...(event.requestId ? { requestId: event.requestId } : {}),
    ...(event.errorType ? { errorType: event.errorType } : {}),
    ...(event.notificationStatus ? { notificationStatus: event.notificationStatus } : {}),
  })
}

export function logSubmissionEvent(event: SubmissionLogEvent): void {
  console.info(serializeSubmissionLog(event))
}
