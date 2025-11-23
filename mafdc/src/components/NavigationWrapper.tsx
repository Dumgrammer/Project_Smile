'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Navigation from './Navigation';

export default function NavigationWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isAdminPage, setIsAdminPage] = useState(false);

  useEffect(() => {
    setMounted(true);
    // List of admin routes that should not show the navigation
    const adminRoutes = ['/login', '/dashboard', '/patients', '/appointments', '/inquiries', '/logs', '/reports','/settings'];
    // Check if current path starts with any admin route
    const adminPage = adminRoutes.some(route => pathname?.startsWith(route));
    setIsAdminPage(adminPage);
  }, [pathname]);

  // Don't render navigation on admin pages after mounting
  if (mounted && isAdminPage) {
    return <>{children}</>;
  }

  // Always render navigation for public pages or during SSR
  return (
    <>
      <Navigation />
      {children}
    </>
  );
} 