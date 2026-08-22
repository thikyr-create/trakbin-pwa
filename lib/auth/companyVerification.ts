// lib/auth/companyVerification.ts
export type DocumentsStatus = 'none' | 'pending' | 'approved' | 'rejected';

export interface CompanyVerification {
  email: boolean;
  profile: boolean;
  documents: DocumentsStatus;
  canOperate: boolean;      // email + profile — documents do NOT gate operations
  fullyVerified: boolean;   // email + profile + documents approved (badge only)
}

/** sessionUser (from auth.getSession()) is the instant source of truth for
 *  email confirmation; the haulers column is kept in sync via healEmailVerified. */
export function getCompanyVerification(hauler: any, sessionUser?: any): CompanyVerification {
  const email = !!hauler?.email_verified || !!sessionUser?.email_confirmed_at;
  const profile = !!(hauler?.business_name && hauler?.license_number && hauler?.operating_address && hauler?.contact_number);
  const documents = (hauler?.documents_status || 'none') as DocumentsStatus;
  const canOperate = email && profile;
  const fullyVerified = canOperate && documents === 'approved';
  return { email, profile, documents, canOperate, fullyVerified };
}

export function canOperate(hauler: any, sessionUser?: any): boolean {
  return getCompanyVerification(hauler, sessionUser).canOperate;
}

/** Self-heal: session proves email confirmed but haulers row lagging → persist it. */
export async function healEmailVerified(client: any, hauler: any): Promise<any> {
  if (!hauler || hauler.email_verified) return hauler;
  try {
    const { data } = await client.auth.getSession();
    if (!data?.session?.user?.email_confirmed_at) return hauler;
    await client.from('haulers').update({ email_verified: true }).eq('id', hauler.id);
    return { ...hauler, email_verified: true };
  } catch {
    return hauler;
  }
}