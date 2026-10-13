'use client';

import { useEffect } from 'react';
import { detectPlatform } from '@/lib/platform';

/**
 * Records on the first page load whether we're inside the Android app, since
 * the `?app=android` launch flag is gone after the first navigation.
 */
export default function PlatformDetector() {
  useEffect(() => {
    detectPlatform();
  }, []);

  return null;
}
