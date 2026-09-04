import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { offlineQueue } from '../services/sync/queue';

export function useOfflineStatus() {
  const [online, setOnline] = useState(true);
  const [queued, setQueued] = useState(0);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setOnline(state.isConnected ?? false);
    });

    const checkQueue = async () => {
      setQueued(await offlineQueue.size());
    };

    checkQueue();
    const offQ = offlineQueue.subscribe(checkQueue);

    return () => {
      unsubscribe();
      offQ();
    };
  }, []);

  return { online, queued };
}