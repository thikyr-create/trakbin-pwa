// lib/core/communications/policies/notificationPolicy.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/** Company-level notification preferences. Future extension: per-user. */
export interface NotificationPreferences {
  companyId: number;
  emailEnabled: boolean;
  eventsDisabled: string[];   // event names this company has opted out of
}

const DEFAULT: NotificationPreferences = { companyId: 0, emailEnabled: true, eventsDisabled: [] };

export const notificationPolicy = {
  async get(companyId: number): Promise<NotificationPreferences> {
    const { data } = await supabase.from('notification_preferences')
      .select('*').eq('company_id', companyId).maybeSingle();
    return data ? { companyId, emailEnabled: data.email_enabled, eventsDisabled: data.events_disabled || [] } : { ...DEFAULT, companyId };
  },

  async shouldSend(companyId: number, event: string): Promise<boolean> {
    const prefs = await this.get(companyId);
    return prefs.emailEnabled && !prefs.eventsDisabled.includes(event);
  },
};