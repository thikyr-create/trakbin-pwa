// lib/features/finance/services/paymentStatsService.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export interface PaymentMethodStat {
  method: string;
  count: number;
  amount: number;
}

export async function fetchPaymentMethodStats(
  company_id: number
): Promise<PaymentMethodStat[]> {
  const { data: buildings } = await supabase
    .from('Buildings')
    .select('custom_id')
    .eq('company_id', company_id);

  const customIds = (buildings || [])
    .map((b: any) => b.custom_id)
    .filter(Boolean);

  if (customIds.length === 0) return [];

  const { data: payments, error } = await supabase
    .from('payments')
    .select('method, channel, amount, status')
    .in('building_id', customIds)
    .eq('status', 'successful')
    .limit(500);

  if (error) {
    console.error('Error fetching payment method stats:', error);
    return [];
  }

  const map = new Map<string, PaymentMethodStat>();

  (payments || []).forEach((p: any) => {
    const method = (p.method || p.channel || 'unknown').toLowerCase();
    const entry = map.get(method) || { method, count: 0, amount: 0 };
    entry.count += 1;
    entry.amount += Number(p.amount) || 0;
    map.set(method, entry);
  });

  return [...map.values()].sort((a, b) => b.amount - a.amount);
}