// lib/services/SyncService.ts
import { createClient } from '@supabase/supabase-js';
import { CollectionEvent } from './types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const QUEUE_KEY = 'trakbin_offline_queue';

export const SyncService = {
  // 1. Queue an event for later
  queueEvent(event: Omit<CollectionEvent, 'id' | 'synced'>): void {
    const queue = this.getQueue();
    queue.push({ ...event, id: crypto.randomUUID(), synced: false });
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    console.log('⏳ Event queued for offline sync:', event.action);
  },

  // 2. Get all pending events
  getQueue(): CollectionEvent[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  },

  // 3. Process the queue (Call this when internet returns)
  async syncPendingEvents(): Promise<void> {
    const queue = this.getQueue();
    if (queue.length === 0) return;

    console.log(`🔄 Syncing ${queue.length} offline events...`);

    const remainingQueue: CollectionEvent[] = [];

    for (const event of queue) {
      try {
        if (event.action === 'complete') {
          await supabase
            .from('Buildings')
            .update({ status: 'picked_up', last_collected: event.timestamp })
            .eq('custom_id', event.building_id);
        } else if (event.action === 'issue') {
          await supabase.from('issues').insert([{
            building_id: event.building_id,
            type: event.issue_type,
            reported_at: event.timestamp,
            status: 'Open'
          }]);
        }
        // If successful, we don't add it back to the remaining queue
      } catch (error) {
        console.error('❌ Sync failed for event:', event.id);
        remainingQueue.push(event); // Keep it in the queue to try again later
      }
    }

    localStorage.setItem(QUEUE_KEY, JSON.stringify(remainingQueue));
  },

  // 4. Auto-sync listener
  initAutoSync(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('🌐 Connection restored. Syncing...');
        this.syncPendingEvents();
      });
    }
  }
};