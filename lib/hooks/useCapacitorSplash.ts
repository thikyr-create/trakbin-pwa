// lib/hooks/useCapacitorSplash.ts
"use client";

import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';

/**
 * Hides the native splash screen after the app has:
 * 1. Loaded
 * 2. Checked auth/session
 * 3. Determined role
 * 4. Routed to the correct dashboard
 * 
 * This hook should be mounted in the root layout or a global provider,
 * NOT tied to a single page component.
 */
export function useCapacitorSplash(ready: boolean) {
  useEffect(() => {
    if (ready && Capacitor.isNativePlatform()) {
      SplashScreen.hide({ fadeOutDuration: 300 });
    }
  }, [ready]);
}