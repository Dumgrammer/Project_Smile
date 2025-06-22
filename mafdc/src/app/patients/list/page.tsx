'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

import { AppSidebar } from "@/components/app-sidebar"
import { DataTable, schema } from "@/components/data-table"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { usePatients } from "@/hooks/patients/patientHooks"
import { z } from "zod"

export default function PatientsList() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const { getPatients, loading: patientsLoading } = usePatients();
  const [patients, setPatients] = useState<z.infer<typeof schema>[]>([]);

  // Memoize the fetchPatients function
  const fetchPatients = useCallback(async () => {
    try {
      const response = await getPatients();
      console.log(response);
      setPatients(response.patients);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  }, [getPatients]);

  useEffect(() => {
    // Check if logged in
    const token = Cookies.get('accessToken');
    const adminDataCookie = Cookies.get('adminData');
    
    if (!token || !adminDataCookie) {
      router.push('/login');
      return;
    }

    setIsLoading(false);
  }, [router]);

  useEffect(() => {

    const loadPatients = async () => {
      if (!isLoading) {
        await fetchPatients();
      }
    };

    loadPatients();

  }, [isLoading, fetchPatients]);

  if (isLoading || patientsLoading) {
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
                <h1 className="text-3xl font-bold">
                  Patients List
                </h1>
                <p className="text-slate-600">
                  Manage all patient records
                </p>
              </div>
              <div className="px-4 lg:px-6">
                <DataTable data={patients} />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
} 