/**
 * Admin Import API Routes
 * 
 * Endpoints for managing ChipDip product import.
 */

import { NextRequest, NextResponse } from 'next/server'
import { importService } from '@/lib/services/import-service'

/**
 * GET /api/admin/import - Get import status
 */
export async function GET() {
  try {
    const status = importService.getStatus()
    return NextResponse.json(status)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/import - Start or stop import
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, settings } = body

    if (action === 'start') {
      await importService.startImport(settings || {})
      return NextResponse.json({ success: true, message: 'Import started' })
    }

    if (action === 'stop') {
      await importService.stopImport()
      return NextResponse.json({ success: true, message: 'Import stopping...' })
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "start" or "stop"' },
      { status: 400 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
