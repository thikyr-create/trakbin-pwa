export type DocumentsStatus = 'none' | 'pending' | 'approved' | 'rejected';

export interface CompanyVerification {
  email: boolean;
  profile: boolean;
  documents: DocumentsStatus;
  canOperate: boolean;      // email + profile — documents do NOT gate operations
  fullyVerified: boolean;   // email + profile + documents approved (badge only)
}

export function getCompanyVerification(hauler: any): CompanyVerification {
  const email = !!hauler?.email_verified;
  const profile = !!(hauler?.business_name && hauler?.license_number && hauler?.operating_address && hauler?.contact_number);
  const documents = (hauler?.documents_status || 'none') as DocumentsStatus;
  const canOperate = email && profile;                 // documents do NOT gate
  const fullyVerified = canOperate && documents === 'approved';
  return { email, profile, documents, canOperate, fullyVerified };
}

export function canOperate(hauler: any): boolean {
  return getCompanyVerification(hauler).canOperate;
}