// lib/services/CollectionService.ts
import { supabaseBrowser } from '@/lib/supabaseBrowser';
import { SyncService } from './SyncService';

const supabase = supabaseBrowser;

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
      console.warn('âš ï¸ Network error. Queuing collection offline.');
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
      console.warn('ï¸ Network error. Queuing issue report offline.');
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