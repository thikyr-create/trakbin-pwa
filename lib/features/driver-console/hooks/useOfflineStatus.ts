// lib/features/driver-console/hooks/useOfflineStatus.ts
"use client";

import { useEffect, useState } from 'react';

/** Count actions queued on-device by the offline infra (any queue key shape). */
function countQueued(): number {
  try {
    let n = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i) || '';
      if (/offline|sync|queue/i.test(k)) {
        const v = JSON.parse(localStorage.getItem(k) || 'null');
        if (Array.isArray(v)) n += v.length;
        else if (v && Array.isArray(v.items)) n += v.items.length;
      }
    }
    return n;
  } catch {
    return 0;
  }
}

export function useOfflineStatus() {
  const [online, setOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [queued, setQueued] = useState(0);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    setQueued(countQueued());
    const t = setInterval(() => setQueued(countQueued()), 3000);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
      clearInterval(t);
    };
  }, []);

  return { online, queued };
}