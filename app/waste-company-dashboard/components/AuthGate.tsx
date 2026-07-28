'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCompanySession } from '@/lib/store/useCompanySession';

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { tenant, loadTenantContext } = useCompanySession();
  const router = useRouter();

  useEffect(() => {
    // Load the tenant context immediately
    loadTenantContext();
  }, [loadTenantContext]);

  // 1. Show loading spinner while fetching auth state
  if (!tenant.loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold uppercase tracking-wider">Initializing Tenant Context...</p>
        </div>
      </div>
    );
  }

  // 2. If loaded but no user ID, redirect to login
  if (!tenant.userId) {
    router.push('/auth');
    return null;
  }

  // 3. If loaded and user exists, render the dashboard
  return <>{children}</>;
}