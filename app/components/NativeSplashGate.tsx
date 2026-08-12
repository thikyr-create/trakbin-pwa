// app/components/NativeSplashGate.tsx
"use client";

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';

/**
 * Hides the native splash once a real screen has rendered.
 * Pilot model: WebView only mounts after JS boots, so first render ≈ app initialized.
 * Failsafe: splash can never hang longer than 6s.
 * Phase 2 upgrade: gate on per-role session.loaded instead of a timer.
 */
export default function NativeSplashGate() {
  const pathname = usePathname();
  const hiddenRef = useRef(false);

  const hide = () => {
    if (hiddenRef.current) return;
    hiddenRef.current = true;
    SplashScreen.hide({ fadeOutDuration: 300 }).catch(() => {});
  };

  // Hide shortly after any route renders its first frame
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const t = setTimeout(hide, 400);
    return () => clearTimeout(t);
  }, [pathname]);

  // Hard failsafe — never strand the user on the splash
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const t = setTimeout(hide, 6000);
    return () => clearTimeout(t);
  }, []);

  return null;
}