import { supabaseBrowser } from '@/lib/supabaseBrowser';
const supabase = supabaseBrowser;
export async function emit(companyId: number, assignmentId: string, type: string, message: string) {
  await supabase.from('assignment_events').insert([{ company_id: companyId, assignment_id: assignmentId, type, message }]);
}