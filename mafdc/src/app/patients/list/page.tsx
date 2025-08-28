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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, RefreshCw } from "lucide-react";

export default function PatientsList() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const { getPatients, loading: patientsLoading } = usePatients();
  const [allPatients, setAllPatients] = useState<z.infer<typeof schema>[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<z.infer<typeof schema>[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 0,
    totalPatients: 0
  });
  const [showArchived, setShowArchived] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    gender: 'all',
    ageRange: 'all',
    status: 'all'
  });

    // Memoize the fetchPatients function
  const fetchPatients = useCallback(async (page = 1, limit = 10, showArchived = false) => {
    try {
      const response = await getPatients(page, limit, '', showArchived);
      setAllPatients(response.patients);
      setFilteredPatients(response.patients);
      setPagination({
        page: response.currentPage,
        limit: limit,
        totalPages: response.totalPages,
        totalPatients: response.totalPatients
      });
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  }, [getPatients]);

  // Client-side filtering function
  const applyFilters = useCallback(() => {
    let filtered = [...allPatients];
    
    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(patient => 
        patient.firstName.toLowerCase().includes(searchTerm) ||
        patient.lastName.toLowerCase().includes(searchTerm) ||
        patient.contactNumber.includes(searchTerm) ||
        (patient.email && patient.email.toLowerCase().includes(searchTerm))
      );
    }
    
    // Gender filter
    if (filters.gender !== 'all') {
      filtered = filtered.filter(patient => patient.gender === filters.gender);
    }
    
    // Age range filter
    if (filters.ageRange !== 'all') {
      filtered = filtered.filter(patient => {
        const age = patient.age;
        switch (filters.ageRange) {
          case '0-18': return age >= 0 && age <= 18;
          case '19-30': return age >= 19 && age <= 30;
          case '31-50': return age >= 31 && age <= 50;
          case '51+': return age >= 51;
          default: return true;
        }
      });
    }
    
    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(patient => {
        if (filters.status === 'active') return patient.isActive;
        if (filters.status === 'archived') return !patient.isActive;
        return true;
      });
    }
    
    setFilteredPatients(filtered);
  }, [allPatients, filters]);

  // Apply filters whenever filters change
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

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
        await fetchPatients(1, 10, showArchived);
      }
    };

    loadPatients();
  }, [isLoading, showArchived, fetchPatients]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ 
      ...prev, 
      [key]: value
    }));
  };

  const handleSearchChange = (value: string) => {
    handleFilterChange('search', value);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPatients(1, 10, showArchived);
    setRefreshing(false);
  };

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
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center mb-4">
                  <div>
                    <h1 className="text-3xl font-bold">
                      Patients List
                    </h1>
                    <p className="text-slate-600">
                      Manage all patient records
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      onClick={() => setShowFilters(!showFilters)}
                      className="flex items-center gap-2"
                    >
                      <Filter className="h-4 w-4" />
                      Filters
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={handleRefresh}
                      disabled={refreshing}
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                      {refreshing ? 'Refreshing...' : 'Refresh'}
                    </Button>
                  </div>
                </div>
              </div>
                              {/* Filters */}
                {showFilters && (
                  <div className="px-4 lg:px-6">
                    <Card className="mb-4">
                      <CardHeader>
                        <CardTitle>Filters</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <Label htmlFor="search-filter">Search</Label>
                                                         <Input
                               id="search-filter"
                               placeholder="Search by name, email, or phone..."
                               defaultValue={filters.search}
                               onChange={(e) => handleSearchChange(e.target.value)}
                             />
                          </div>
                          <div>
                            <Label htmlFor="gender-filter">Gender</Label>
                                                         <Select value={filters.gender} onValueChange={(value) => handleFilterChange('gender', value)}>
                               <SelectTrigger>
                                 <SelectValue placeholder="All genders" />
                               </SelectTrigger>
                               <SelectContent>
                                 <SelectItem value="all">All Genders</SelectItem>
                                 <SelectItem value="Male">Male</SelectItem>
                                 <SelectItem value="Female">Female</SelectItem>
                               </SelectContent>
                             </Select>
                          </div>
                          <div>
                            <Label htmlFor="age-filter">Age Range</Label>
                                                         <Select value={filters.ageRange} onValueChange={(value) => handleFilterChange('ageRange', value)}>
                               <SelectTrigger>
                                 <SelectValue placeholder="All ages" />
                               </SelectTrigger>
                               <SelectContent>
                                 <SelectItem value="all">All Ages</SelectItem>
                                 <SelectItem value="0-18">0-18</SelectItem>
                                 <SelectItem value="19-30">19-30</SelectItem>
                                 <SelectItem value="31-50">31-50</SelectItem>
                                 <SelectItem value="51+">51+</SelectItem>
                               </SelectContent>
                             </Select>
                          </div>
                          <div>
                            <Label htmlFor="status-filter">Status</Label>
                                                         <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                               <SelectTrigger>
                                 <SelectValue placeholder="All statuses" />
                               </SelectTrigger>
                               <SelectContent>
                                 <SelectItem value="all">All Statuses</SelectItem>
                                 <SelectItem value="active">Active</SelectItem>
                                 <SelectItem value="archived">Archived</SelectItem>
                               </SelectContent>
                             </Select>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                <div id="tour-patient-list" className="px-4 lg:px-6">
                                     <DataTable 
                     data={filteredPatients} 
                     pagination={pagination}
                     showArchived={showArchived}
                     onShowArchivedChange={setShowArchived}
                     onPageChange={(page, limit) => fetchPatients(page, limit, showArchived)}
                   />
                </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
} 