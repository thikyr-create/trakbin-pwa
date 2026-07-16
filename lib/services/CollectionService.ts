// lib/services/CollectionService.ts
import { createClient } from '@supabase/supabase-js';
import { SyncService } from './SyncService';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const CollectionService = {
  async completeCollection(buildingId: string): Promise<{ success: boolean }> {
    const timestamp = new Date().toISOString();

    try {
      const { error } = await supabase
        .from('Buildings')
        .update({ status: 'picked_up', last_collected: timestamp })
        .eq('custom_id', buildingId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.warn('⚠️ Network error. Queuing collection offline.');
      // Fallback to offline queue
      SyncService.queueEvent({
        building_id: buildingId,
        action: 'complete',
        timestamp
      });
      return { success: true }; // Return true anyway so UI updates instantly!
    }
  },

  async reportIssue(buildingId: string, issueType: string): Promise<{ success: boolean }> {
    const timestamp = new Date().toISOString();

    try {
      const { error } = await supabase.from('issues').insert([{
        building_id: buildingId,
        type: issueType,
        reported_at: timestamp,
        status: 'Open'
      }]);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.warn('️ Network error. Queuing issue report offline.');
      SyncService.queueEvent({
        building_id: buildingId,
        action: 'issue',
        issue_type: issueType,
        timestamp
      });
      return { success: true };
    }
  }
};