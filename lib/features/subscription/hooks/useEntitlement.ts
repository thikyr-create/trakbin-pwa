// lib/features/subscription/hooks/useEntitlement.ts
"use client";

import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabaseBrowser';
import { canOrganizationAccess } from '@/lib/core/finance/subscription-engine/entitlement-resolver';
import type { Capability } from '@/lib/core/finance/subscription-engine/plans';

const supabase = supabaseBrowser;

// allowed: null = checking Â· true = entitled Â· false = locked
export function useEntitlement(companyId: number | null | undefined, cap: Capability) {
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    if (!companyId) { setAllowed(false); return; }
    let alive = true;
    canOrganizationAccess(supabase, companyId, cap).then((ok) => { if (alive) setAllowed(ok); });
    return () => { alive = false; };
  }, [companyId, cap]);

  return { allowed, checking: allowed === null };
}