'use client';

import { usePathname } from 'next/navigation';
import Navigation from './Navigation';

export default function NavigationWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // List of admin routes that should not show the navigation
  const adminRoutes = ['/login', '/dashboard', '/patients', '/appointments', '/inquiries', '/logs', '/settings'];
  
  // Check if current path starts with any admin route
  const isAdminPage = adminRoutes.some(route => pathname?.startsWith(route));

  // Don't render navigation on admin pages
  if (isAdminPage) {
    return <>{children}</>;
  }

  return (
    <>
      <Navigation />
      {children}
    </>
  );
} 