'use client';

import { useState, useLayoutEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import UnauthorizedPage from './UnauthorizedPage';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  // Use useLayoutEffect to check auth synchronously before paint
  useLayoutEffect(() => {
    const token = Cookies.get('accessToken');
    const adminData = Cookies.get('adminData');

    if (!token || !adminData) {
      // Not authenticated
      setIsAuthenticated(false);
      setIsChecking(false);
      return;
    }

    // Authenticated
    setIsAuthenticated(true);
    setIsChecking(false);
  }, [router]);

  // Show loading state while checking
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  // Show unauthorized page if not authenticated
  if (!isAuthenticated) {
    return <UnauthorizedPage />;
  }

  return <>{children}</>;
}

