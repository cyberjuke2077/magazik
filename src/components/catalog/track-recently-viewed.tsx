'use client'

import { useEffect } from 'react'
import { addRecentlyViewed } from '@/lib/recently-viewed'

interface TrackRecentlyViewedProps {
  slug: string
  name: string
  partNumber: string
  manufacturer: string
  categorySlug: string
  price: number
}

/**
 * Client-side effect: records the current product into the recently-viewed
 * localStorage list. Renders nothing.
 */
export function TrackRecentlyViewed(props: TrackRecentlyViewedProps) {
  useEffect(() => {
    addRecentlyViewed(props)
    // We only want to track once per mount; props are stable per page
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.slug])

  return null
}
