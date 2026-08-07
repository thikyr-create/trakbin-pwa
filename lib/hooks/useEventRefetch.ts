"use client";
import { useEffect } from 'react';
import { bus } from '@/lib/core/event-bus';
import type { PlatformEventType } from '@/lib/core/event-bus';

export function useEventRefetch(triggers: PlatformEventType[], refetch: () => void) {
  const key = triggers.join(',');
  useEffect(() => {
    return bus.subscribe(key.split(',') as PlatformEventType[], `page-refetch-${key}`, () => refetch());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}