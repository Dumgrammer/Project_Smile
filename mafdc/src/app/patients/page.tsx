'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';

export default function PatientsRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to patients list page
    router.push('/patients/list');
  }, [router]);

  return (
    <AuthGuard>
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-600"></div>
      </div>
    </AuthGuard>
  );
} 