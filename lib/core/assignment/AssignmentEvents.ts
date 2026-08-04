import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
export async function emit(companyId: number, assignmentId: string, type: string, message: string) {
  await supabase.from('assignment_events').insert([{ company_id: companyId, assignment_id: assignmentId, type, message }]);
}