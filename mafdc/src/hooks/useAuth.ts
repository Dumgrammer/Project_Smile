'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCookie } from 'cookies-next';

export function useAuth(requireAuth = true) {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = getCookie('auth-token');
    
    if (!token && requireAuth) {
      // Redirect to login if not authenticated and auth is required
      router.push('/login');
    } else if (token && !requireAuth) {
      // Redirect to dashboard if already authenticated and trying to access public routes
      router.push('/dashboard');
    }
    
    setIsLoading(false);
  }, [router, requireAuth]);

  return { isLoading };
} 