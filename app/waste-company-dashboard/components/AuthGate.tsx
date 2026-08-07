'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCompanySession } from '@/lib/store/useCompanySession';

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { tenant, loadTenantContext } = useCompanySession();
  const router = useRouter();

  useEffect(() => {
    loadTenantContext();
  }, [loadTenantContext]);

  // No loading screen — dashboard renders immediately with skeleton states
  // If not authenticated, redirect after first render
  useEffect(() => {
    if (tenant.loaded && !tenant.userId) {
      router.push('/auth');
    }
  }, [tenant.loaded, tenant.userId, router]);

  return <>{children}</>;
}