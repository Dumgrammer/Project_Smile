'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { useDashboardStats } from '@/hooks/dashboard/dashboardHooks';

interface AdminData {
  firstName: string;
  lastName: string;
  role: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { stats, loading, error } = useDashboardStats();

  useEffect(() => {
    // Check if logged in
    const token = Cookies.get('accessToken');
    const adminDataCookie = Cookies.get('adminData');
    
    if (!token || !adminDataCookie) {
      router.push('/login');
      return;
    }

    try {
      setAdminData(JSON.parse(adminDataCookie));
    } catch (error) {
      console.error('Error parsing admin data:', error);
      router.push('/login');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <h1 className="text-3xl font-bold text-slate-800">
                  Welcome, {adminData?.firstName} {adminData?.lastName}
                </h1>
                <p className="text-slate-600">
                  Dashboard | {adminData?.role === 'superadmin' ? 'Super Admin' : 'Admin'} View
                </p>
              </div>
              <SectionCards
                id="tour-dashboard-stats"
                totalVisitors={stats?.totalVisitors}
                activePatients={stats?.activePatients}
                totalRevenue={stats?.totalRevenue}
                growthRate={stats?.growthRate}
                loading={loading}
                error={error}
              />
              <div id="tour-recent-activity" className="px-4 lg:px-6">
                <ChartAreaInteractive />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
