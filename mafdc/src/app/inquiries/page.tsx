'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectTrigger, SelectValue, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Eye, Archive, RefreshCw, RotateCcw, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Filter } from "lucide-react";
import { ReplyDialog } from "@/components/reply";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { useInquiries } from "@/hooks/inquiry/inquiryHooks";
import { Inquiry } from "@/interface/Inquiry";
import { toast } from "sonner";
import AuthGuard from '@/components/AuthGuard';

export default function InquiriesPage() {
  const { isLoading: authLoading } = useAuth(true); // Require authentication
  const { 
    getInquiries, 
    updateInquiryStatus, 
    archiveInquiry,
    restoreInquiry,
    loading 
  } = useInquiries();
  
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [showReadDialog, setShowReadDialog] = useState(false);
  const [showReplyDialog, setShowReplyDialog] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [archiveReason, setArchiveReason] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 0,
    total: 0
  });
  const [currentTab, setCurrentTab] = useState('active');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    dateRange: 'all',
    service: 'all'
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Unread': return 'destructive';
      case 'Read': return 'secondary';
      case 'Replied': return 'default';
      default: return 'secondary';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const fetchInquiries = useCallback(async (page?: number, limit?: number, tab?: string) => {
    setRefreshing(true);
    try {
      const currentPage = page ?? pagination.page;
      const currentLimit = limit ?? pagination.limit;
      const currentTabValue = tab ?? currentTab;
      
      const archived = currentTabValue === 'archived';
      const result = await getInquiries(currentPage, currentLimit, undefined, archived);
      
      if (result.success && result.data) {
        // Map the backend response to our frontend format
        const mappedInquiries = result.data.inquiries.map(inquiry => ({
          ...inquiry,
          id: inquiry._id || inquiry.id
        }));
        setInquiries(mappedInquiries);
        
        // Update pagination info
        setPagination({
          page: result.data.currentPage || currentPage,
          limit: currentLimit,
          totalPages: result.data.totalPages || 1,
          total: result.data.total || 0
        });
      } else {
        toast.error(result.error || 'Failed to fetch inquiries');
      }
    } catch (error) {
      console.error('Error fetching inquiries:', error);
      toast.error('Failed to fetch inquiries');
    } finally {
      setRefreshing(false);
    }
  }, [getInquiries, currentTab, pagination.page, pagination.limit]);

  // Fetch inquiries on component mount only
  useEffect(() => {
    if (!authLoading) {
      fetchInquiries();
    }
  }, [authLoading, fetchInquiries]);

  // Fetch inquiries when pagination or tab changes
  useEffect(() => {
    if (!authLoading) {
      fetchInquiries();
    }
  }, [authLoading, fetchInquiries, pagination.page, pagination.limit, currentTab]);

  const handleReadInquiry = async (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
    setShowReadDialog(true);
    
    // Mark as read if it's unread
    if (inquiry.status === 'Unread') {
      try {
        const result = await updateInquiryStatus(inquiry.id, 'Read');
        if (result.success) {
          // Update local state
          setInquiries(prev => prev.map(inq => 
            inq.id === inquiry.id 
              ? { ...inq, status: 'Read' as const }
              : inq
          ));
          // Update selected inquiry for dialog
          setSelectedInquiry({ ...inquiry, status: 'Read' });
        }
      } catch (error) {
        console.error('Error marking as read:', error);
      }
    }
  };

  const handleReplyInquiry = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
    setShowReplyDialog(true);
    setShowReadDialog(false);
  };

  const handleReplySuccess = async (inquiryId: string) => {
    try {
      const result = await updateInquiryStatus(inquiryId, 'Replied');
      if (result.success) {
        // Update local state
        setInquiries(prev => prev.map(inquiry => 
          inquiry.id === inquiryId 
            ? { ...inquiry, status: 'Replied' as const }
            : inquiry
        ));
        toast.success('Inquiry marked as replied');
      }
    } catch (error) {
      console.error('Error updating reply status:', error);
    }
  };

  const handleArchiveInquiry = async (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
    setShowArchiveDialog(true);
    setArchiveReason('');
  };

  const confirmArchiveInquiry = async () => {
    if (!selectedInquiry) return;
    
    if (!archiveReason.trim()) {
      toast.error('Please provide a reason for archiving this inquiry');
      return;
    }

    try {
      const result = await archiveInquiry(selectedInquiry.id, archiveReason.trim(), 'Admin');
        
      if (result.success) {
        // Update local state
        setInquiries(prev => prev.map(inq => 
          inq.id === selectedInquiry.id 
            ? { ...inq, isArchived: true, archiveReason: archiveReason.trim(), archivedAt: new Date().toISOString(), archivedBy: 'Admin' }
            : inq
        ));
        toast.success('Inquiry archived successfully');
        setShowArchiveDialog(false);
        setArchiveReason('');
        setSelectedInquiry(null);
      } else {
        toast.error(result.error || 'Failed to archive inquiry');
      }
    } catch (error) {
      console.error('Error archiving inquiry:', error);
      toast.error('Failed to archive inquiry');
    }
  };

  const handleRestoreInquiry = async (inquiry: Inquiry) => {
    const actionText = 'Restore';
    
    // Use toast for confirmation instead of direct action
    toast.message(`${actionText} inquiry from ${inquiry.fullName}?`, {
      action: {
        label: actionText,
        onClick: async () => {
          try {
            const result = await restoreInquiry(inquiry.id);
              
            if (result.success) {
              // Update local state
              setInquiries(prev => prev.map(inq => 
                inq.id === inquiry.id 
                  ? { ...inq, isArchived: false }
                  : inq
              ));
              toast.success('Inquiry restored');
            } else {
              toast.error(result.error || 'Failed to restore inquiry');
            }
          } catch (error) {
            console.error('Error restoring inquiry:', error);
            toast.error('Failed to restore inquiry');
          }
        }
      },
      cancel: {
        label: 'Cancel',
        onClick: () => {}
      }
    });
  };

  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPagination(prev => ({ ...prev, page: 1, limit: newPageSize }));
  };

  const handleTabChange = (tab: string) => {
    setCurrentTab(tab);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page when changing tabs
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ 
      ...prev, 
      [key]: value
    }));
  };

  // Filter inquiries based on current filters
  const filteredInquiries = inquiries.filter(inquiry => {
    const matchesSearch = !filters.search || 
      inquiry.fullName.toLowerCase().includes(filters.search.toLowerCase()) ||
      inquiry.email.toLowerCase().includes(filters.search.toLowerCase()) ||
      inquiry.subject.toLowerCase().includes(filters.search.toLowerCase()) ||
      inquiry.message.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesStatus = filters.status === 'all' || inquiry.status === filters.status;
    
    const matchesService = filters.service === 'all' || inquiry.subject === filters.service;
    
    const matchesDateRange = filters.dateRange === 'all' || (() => {
      const inquiryDate = new Date(inquiry.createdAt);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(today.getTime() - (today.getDay() * 24 * 60 * 60 * 1000));
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const yearStart = new Date(now.getFullYear(), 0, 1);
      
      switch (filters.dateRange) {
        case 'today':
          return inquiryDate >= today;
        case 'week':
          return inquiryDate >= weekStart;
        case 'month':
          return inquiryDate >= monthStart;
        case 'year':
          return inquiryDate >= yearStart;
        default:
          return true;
      }
    })();
    
    return matchesSearch && matchesStatus && matchesService && matchesDateRange;
  });

  const displayedInquiries = filteredInquiries;

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="px-4 lg:px-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center mb-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold">Inquiries Management</h1>
                  <p className="text-slate-600 text-sm sm:text-base">Manage customer inquiries and communications</p>
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
                    onClick={() => fetchInquiries()}
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <Label htmlFor="search-filter">Search</Label>
                        <Input
                          id="search-filter"
                          placeholder="Search by name, email, or subject..."
                          value={filters.search}
                          onChange={(e) => handleFilterChange('search', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="status-filter">Status</Label>
                        <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="All statuses" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="Unread">Unread</SelectItem>
                            <SelectItem value="Read">Read</SelectItem>
                            <SelectItem value="Replied">Replied</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="service-filter">Service</Label>
                        <Select value={filters.service} onValueChange={(value) => handleFilterChange('service', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="All services" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Services</SelectItem>
                            <SelectItem value="Orthodontic Braces">Orthodontic Braces</SelectItem>
                            <SelectItem value="Cleaning/Oral Prophylaxis">Cleaning/Oral Prophylaxis</SelectItem>
                            <SelectItem value="Extraction">Extraction</SelectItem>
                            <SelectItem value="Teeth Whitening">Teeth Whitening</SelectItem>
                            <SelectItem value="Restoration/Pasta">Restoration/Pasta</SelectItem>
                            <SelectItem value="Dental Crown">Dental Crown</SelectItem>
                            <SelectItem value="Fixed Bridge">Fixed Bridge</SelectItem>
                            <SelectItem value="Veneers">Veneers</SelectItem>
                            <SelectItem value="Denture">Denture</SelectItem>
                            <SelectItem value="General Inquiry">General Inquiry</SelectItem>
                            <SelectItem value="Appointment Scheduling">Appointment Scheduling</SelectItem>
                            <SelectItem value="Emergency">Emergency</SelectItem>
                            <SelectItem value="Insurance Questions">Insurance Questions</SelectItem>
                            <SelectItem value="Payment Options">Payment Options</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="date-filter">Date Range</Label>
                        <Select value={filters.dateRange} onValueChange={(value) => handleFilterChange('dateRange', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="All dates" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Dates</SelectItem>
                            <SelectItem value="today">Today</SelectItem>
                            <SelectItem value="week">This Week</SelectItem>
                            <SelectItem value="month">This Month</SelectItem>
                            <SelectItem value="year">This Year</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            
            <div className="px-4 lg:px-6">
              {/* Inquiries Table with Tabs */}
              <Card id="tour-inquiry-list">
                <CardHeader>
                  <CardTitle>Customer Inquiries</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
                    <TabsList id="tour-inquiry-filters" className="mb-4 flex flex-row w-full justify-center bg-slate-100 dark:bg-slate-800 rounded-full shadow-sm p-1 gap-2">
                      <TabsTrigger value="active" className="flex-1 px-4 py-2 text-sm font-semibold rounded-full transition data-[state=active]:bg-violet-600 dark:data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:bg-transparent data-[state=inactive]:text-slate-600 dark:data-[state=inactive]:text-slate-300">
                        Active Messages ({currentTab === 'active' ? pagination.total : '...'})
                      </TabsTrigger>
                      <TabsTrigger value="archived" className="flex-1 px-4 py-2 text-sm font-semibold rounded-full transition data-[state=active]:bg-violet-600 dark:data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:bg-transparent data-[state=inactive]:text-slate-600 dark:data-[state=inactive]:text-slate-300">
                        Archived Messages ({currentTab === 'archived' ? pagination.total : '...'})
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="active">
                      {/* Desktop Table */}
                      <div className="hidden md:block">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="dark:text-gray-300">Customer</TableHead>
                              <TableHead className="dark:text-gray-300">Subject</TableHead>
                              <TableHead className="dark:text-gray-300">Status</TableHead>
                              <TableHead className="dark:text-gray-300">Date</TableHead>
                              <TableHead className="dark:text-gray-300">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {displayedInquiries.map((inquiry) => (
                              <TableRow 
                                key={inquiry.id} 
                                className={inquiry.status === 'Unread' ? 'bg-red-50 dark:bg-violet-950/40' : 'dark:border-gray-700'}
                              >
                                <TableCell>
                                  <div>
                                    <div className="font-medium dark:text-white">{inquiry.fullName}</div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400 break-all">{inquiry.email}</div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">{inquiry.phone}</div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="max-w-xs">
                                    <div className="font-medium truncate dark:text-white">{inquiry.subject}</div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400 truncate">{inquiry.message}</div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant={getStatusBadgeVariant(inquiry.status)} className="dark:bg-violet-700 dark:text-white dark:border-violet-600">
                                    {inquiry.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {formatDate(inquiry.createdAt)}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => handleReadInquiry(inquiry)}
                                      className="dark:border-gray-600 dark:hover:bg-gray-700"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => handleArchiveInquiry(inquiry)}
                                      disabled={loading}
                                      className="dark:border-gray-600 dark:hover:bg-gray-700"
                                    >
                                      <Archive className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                            {displayedInquiries.length === 0 && (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-gray-500 dark:text-gray-400">
                                  {currentTab === 'active' ? 'No active inquiries found' : 'No archived inquiries found'}
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Mobile Cards */}
                      <div className="md:hidden space-y-4">
                        {displayedInquiries.map((inquiry) => (
                          <div 
                            key={inquiry.id}
                            className={`p-4 rounded-lg border ${
                              inquiry.status === 'Unread' 
                                ? 'bg-red-50 dark:bg-violet-950/40 border-red-200 dark:border-violet-800' 
                                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                            }`}
                          >
                            <div className="space-y-3">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-medium text-gray-900 dark:text-white truncate">{inquiry.fullName}</h3>
                                  <p className="text-sm text-gray-500 dark:text-gray-400 break-all">{inquiry.email}</p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">{inquiry.phone}</p>
                                </div>
                                <Badge variant={getStatusBadgeVariant(inquiry.status)} className="ml-2 text-xs dark:bg-violet-700 dark:text-white dark:border-violet-600 flex-shrink-0">
                                  {inquiry.status}
                                </Badge>
                              </div>
                              
                              <div>
                                <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-1">{inquiry.subject}</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{inquiry.message}</p>
                              </div>
                              
                              <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-600">
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatDate(inquiry.createdAt)}
                                </span>
                                <div className="flex items-center gap-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleReadInquiry(inquiry)}
                                    className="dark:border-gray-600 dark:hover:bg-gray-700"
                                  >
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleArchiveInquiry(inquiry)}
                                    disabled={loading}
                                    className="dark:border-gray-600 dark:hover:bg-gray-700"
                                  >
                                    <Archive className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        {displayedInquiries.length === 0 && (
                          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            {currentTab === 'active' ? 'No active inquiries found' : 'No archived inquiries found'}
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="archived">
                      {/* Desktop Table */}
                      <div className="hidden md:block">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="dark:text-gray-300">Customer</TableHead>
                              <TableHead className="dark:text-gray-300">Subject</TableHead>
                              <TableHead className="dark:text-gray-300">Status</TableHead>
                              <TableHead className="dark:text-gray-300">Date</TableHead>
                              <TableHead className="dark:text-gray-300">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {displayedInquiries.map((inquiry) => (
                              <TableRow key={inquiry.id} className="opacity-70 dark:border-gray-700">
                                <TableCell>
                                  <div>
                                    <div className="font-medium dark:text-white">{inquiry.fullName}</div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400 break-all">{inquiry.email}</div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">{inquiry.phone}</div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="max-w-xs">
                                    <div className="font-medium truncate dark:text-white">{inquiry.subject}</div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400 truncate">{inquiry.message}</div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-wrap gap-1">
                                    <Badge variant={getStatusBadgeVariant(inquiry.status)} className="dark:bg-violet-700 dark:text-white dark:border-violet-600">
                                      {inquiry.status}
                                    </Badge>
                                    <Badge variant="secondary" className="dark:bg-gray-700 dark:text-gray-300">
                                      Archived
                                    </Badge>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {formatDate(inquiry.createdAt)}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => handleReadInquiry(inquiry)}
                                      className="dark:border-gray-600 dark:hover:bg-gray-700"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      className="text-green-600 hover:text-green-700 dark:border-gray-600 dark:hover:bg-gray-700"
                                      onClick={() => handleRestoreInquiry(inquiry)}
                                      disabled={loading}
                                      title="Restore inquiry"
                                    >
                                      <RotateCcw className="h-4 w-4" />
                                    </Button>

                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                            {displayedInquiries.length === 0 && (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-gray-500 dark:text-gray-400">
                                  No archived inquiries found
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Mobile Cards */}
                      <div className="md:hidden space-y-4">
                        {displayedInquiries.map((inquiry) => (
                          <div 
                            key={inquiry.id}
                            className="p-4 rounded-lg border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-70"
                          >
                            <div className="space-y-3">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-medium text-gray-900 dark:text-white truncate">{inquiry.fullName}</h3>
                                  <p className="text-sm text-gray-500 dark:text-gray-400 break-all">{inquiry.email}</p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">{inquiry.phone}</p>
                                </div>
                                <div className="ml-2 flex flex-col gap-1 flex-shrink-0">
                                  <Badge variant={getStatusBadgeVariant(inquiry.status)} className="text-xs dark:bg-violet-700 dark:text-white dark:border-violet-600">
                                    {inquiry.status}
                                  </Badge>
                                  <Badge variant="secondary" className="text-xs dark:bg-gray-700 dark:text-gray-300">
                                    Archived
                                  </Badge>
                                </div>
                              </div>
                              
                              <div>
                                <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-1">{inquiry.subject}</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{inquiry.message}</p>
                              </div>
                              
                              <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-600">
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatDate(inquiry.createdAt)}
                                </span>
                                <div className="flex items-center gap-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleReadInquiry(inquiry)}
                                    className="dark:border-gray-600 dark:hover:bg-gray-700"
                                  >
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    className="text-green-600 hover:text-green-700 dark:border-gray-600 dark:hover:bg-gray-700"
                                    onClick={() => handleRestoreInquiry(inquiry)}
                                    disabled={loading}
                                    title="Restore inquiry"
                                  >
                                    <RotateCcw className="h-3 w-3" />
                                  </Button>

                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        {displayedInquiries.length === 0 && (
                          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            No archived inquiries found
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                  
                  {/* Pagination Controls */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 py-4 border-t dark:border-gray-700 gap-4 sm:gap-0">
                    <div className="text-slate-500 dark:text-gray-400 text-xs sm:text-sm flex">
                      <span className="font-medium">{pagination.total}</span> total inquiries
                    </div>
                    
                    {/* Mobile Layout */}
                    <div className="flex flex-col gap-3 w-full sm:hidden">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="rows-per-page-mobile" className="text-xs font-medium text-violet-600 dark:text-violet-400">
                            Rows
                          </Label>
                          <Select
                            value={`${pagination.limit}`}
                            onValueChange={(value) => handlePageSizeChange(Number(value))}
                          >
                            <SelectTrigger className="w-16 h-8 border-violet-200 dark:border-violet-700 dark:bg-gray-800" id="rows-per-page-mobile">
                              <SelectValue placeholder={pagination.limit} />
                            </SelectTrigger>
                            <SelectContent side="top" className="dark:bg-gray-800 dark:border-gray-700">
                              {[5, 10, 20, 30, 50].map((size) => (
                                <div 
                                  key={size} 
                                  className="hover:bg-violet-50/20 dark:hover:bg-violet-900/20 cursor-pointer px-2 py-1.5 text-xs dark:text-gray-300"
                                  onClick={() => handlePageSizeChange(size)}
                                >
                                  {size}
                                </div>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center justify-center text-xs font-medium dark:text-gray-300">
                          Page <span className="text-violet-600 dark:text-violet-400 mx-1 font-semibold">{pagination.page}</span> of{" "}
                          <span className="text-violet-600 dark:text-violet-400 mx-1 font-semibold">{pagination.totalPages}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="outline"
                          className="h-8 w-8 p-0 border-slate-200 dark:border-gray-600 hover:bg-slate-50 dark:hover:bg-gray-700"
                          onClick={() => handlePageChange(1)}
                          disabled={pagination.page === 1}
                        >
                          <span className="sr-only">Go to first page</span>
                          <ChevronsLeft className="text-violet-600 dark:text-violet-400 h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          className="h-8 w-8 p-0 border-slate-200 dark:border-gray-600 hover:bg-slate-50 dark:hover:bg-gray-700"
                          onClick={() => handlePageChange(pagination.page - 1)}
                          disabled={pagination.page === 1}
                        >
                          <span className="sr-only">Go to previous page</span>
                          <ChevronLeft className="text-violet-600 dark:text-violet-400 h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          className="h-8 w-8 p-0 border-slate-200 dark:border-gray-600 hover:bg-slate-50 dark:hover:bg-gray-700"
                          onClick={() => handlePageChange(pagination.page + 1)}
                          disabled={pagination.page >= pagination.totalPages}
                        >
                          <span className="sr-only">Go to next page</span>
                          <ChevronRight className="text-violet-600 dark:text-violet-400 h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          className="h-8 w-8 p-0 border-slate-200 dark:border-gray-600 hover:bg-slate-50 dark:hover:bg-gray-700"
                          onClick={() => handlePageChange(pagination.totalPages)}
                          disabled={pagination.page >= pagination.totalPages}
                        >
                          <span className="sr-only">Go to last page</span>
                          <ChevronsRight className="text-violet-600 dark:text-violet-400 h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden sm:flex items-center gap-8">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="rows-per-page" className="text-sm font-medium text-violet-600 dark:text-violet-400">
                          Rows per page
                        </Label>
                        <Select
                          value={`${pagination.limit}`}
                          onValueChange={(value) => handlePageSizeChange(Number(value))}
                        >
                          <SelectTrigger className="w-20 border-violet-200 dark:border-violet-700 dark:bg-gray-800" id="rows-per-page">
                            <SelectValue placeholder={pagination.limit} />
                          </SelectTrigger>
                          <SelectContent side="top" className="dark:bg-gray-800 dark:border-gray-700">
                            {[5, 10, 20, 30, 50].map((size) => (
                              <div 
                                key={size} 
                                className="hover:bg-violet-50/20 dark:hover:bg-violet-900/20 cursor-pointer px-2 py-1.5 text-sm dark:text-gray-300"
                                onClick={() => handlePageSizeChange(size)}
                              >
                                {size}
                              </div>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center justify-center text-sm font-medium dark:text-gray-300">
                        Page <span className="text-violet-600 dark:text-violet-400 mx-1 font-semibold">{pagination.page}</span> of{" "}
                        <span className="text-violet-600 dark:text-violet-400 mx-1 font-semibold">{pagination.totalPages}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          className="h-8 w-8 p-0 border-slate-200 dark:border-gray-600 hover:bg-slate-50 dark:hover:bg-gray-700"
                          onClick={() => handlePageChange(1)}
                          disabled={pagination.page === 1}
                        >
                          <span className="sr-only">Go to first page</span>
                          <ChevronsLeft className="text-violet-600 dark:text-violet-400" />
                        </Button>
                        <Button
                          variant="outline"
                          className="h-8 w-8 p-0 border-slate-200 dark:border-gray-600 hover:bg-slate-50 dark:hover:bg-gray-700"
                          onClick={() => handlePageChange(pagination.page - 1)}
                          disabled={pagination.page === 1}
                        >
                          <span className="sr-only">Go to previous page</span>
                          <ChevronLeft className="text-violet-600 dark:text-violet-400" />
                        </Button>
                        <Button
                          variant="outline"
                          className="h-8 w-8 p-0 border-slate-200 dark:border-gray-600 hover:bg-slate-50 dark:hover:bg-gray-700"
                          onClick={() => handlePageChange(pagination.page + 1)}
                          disabled={pagination.page >= pagination.totalPages}
                        >
                          <span className="sr-only">Go to next page</span>
                          <ChevronRight className="text-violet-600 dark:text-violet-400" />
                        </Button>
                        <Button
                          variant="outline"
                          className="h-8 w-8 p-0 border-slate-200 dark:border-gray-600 hover:bg-slate-50 dark:hover:bg-gray-700"
                          onClick={() => handlePageChange(pagination.totalPages)}
                          disabled={pagination.page >= pagination.totalPages}
                        >
                          <span className="sr-only">Go to last page</span>
                          <ChevronsRight className="text-violet-600 dark:text-violet-400" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </SidebarInset>

      {/* Read Inquiry Dialog */}
      <Dialog open={showReadDialog} onOpenChange={setShowReadDialog}>
        <DialogContent className="w-full max-w-xs sm:max-w-2xl p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Inquiry Details</DialogTitle>
          </DialogHeader>
          {selectedInquiry && (
            <div className="space-y-4 sm:space-y-6 py-2 sm:py-4">
              {/* Customer Information */}
              <div className="bg-gray-50 dark:bg-gray-800 p-3 sm:p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 sm:mb-3 text-sm sm:text-base">Customer Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Full Name</p>
                    <p className="font-medium text-sm sm:text-base dark:text-white">{selectedInquiry.fullName}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Email</p>
                    <p className="font-medium text-sm sm:text-base break-all dark:text-white">{selectedInquiry.email}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Phone</p>
                    <p className="font-medium text-sm sm:text-base dark:text-white">{selectedInquiry.phone}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Date Received</p>
                    <p className="font-medium text-sm sm:text-base dark:text-white">{formatDate(selectedInquiry.createdAt)}</p>
                  </div>
                </div>
              </div>

              {/* Inquiry Details */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 sm:mb-3 text-sm sm:text-base">Inquiry Details</h3>
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Subject</p>
                    <p className="font-medium text-base sm:text-lg dark:text-white">{selectedInquiry.subject}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Message</p>
                    <div className="bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-lg p-3 sm:p-4">
                      <p className="text-gray-900 dark:text-gray-100 leading-relaxed whitespace-pre-wrap text-sm sm:text-base">
                        {selectedInquiry.message}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Archive Information (if archived) */}
              {selectedInquiry.isArchived && (
                <div className="bg-orange-50 dark:bg-orange-900/20 p-3 sm:p-4 rounded-lg border-l-4 border-orange-400 dark:border-orange-500">
                  <h3 className="font-semibold text-orange-900 dark:text-orange-300 mb-2 text-sm sm:text-base">Archive Information</h3>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs sm:text-sm text-orange-700 dark:text-orange-400">Reason:</p>
                      <p className="text-orange-900 dark:text-orange-200 text-sm">{selectedInquiry.archiveReason || 'No reason provided'}</p>
                    </div>
                    {selectedInquiry.archivedAt && (
                      <div>
                        <p className="text-xs sm:text-sm text-orange-700 dark:text-orange-400">Archived on:</p>
                        <p className="text-orange-900 dark:text-orange-200 text-sm">{formatDate(selectedInquiry.archivedAt)}</p>
                      </div>
                    )}
                    {selectedInquiry.archivedBy && (
                      <div>
                        <p className="text-xs sm:text-sm text-orange-700 dark:text-orange-400">Archived by:</p>
                        <p className="text-orange-900 dark:text-orange-200 text-sm">{selectedInquiry.archivedBy}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Status and Actions */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-3 sm:pt-4 border-t dark:border-gray-700 gap-3 sm:gap-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Status:</span>
                  <Badge variant={getStatusBadgeVariant(selectedInquiry.status)} className="text-xs">
                    {selectedInquiry.status}
                  </Badge>
                  {selectedInquiry.isArchived && (
                    <Badge variant="secondary" className="text-xs">Archived</Badge>
                  )}
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button variant="outline" onClick={() => setShowReadDialog(false)} className="flex-1 sm:flex-none text-xs sm:text-sm">
                    Close
                  </Button>
                  <Button 
                    className="bg-violet-600 hover:bg-violet-700 flex-1 sm:flex-none text-xs sm:text-sm"
                    onClick={() => handleReplyInquiry(selectedInquiry)}
                  >
                    Reply
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reply Dialog */}
      <ReplyDialog
        inquiry={selectedInquiry}
        open={showReplyDialog}
        onOpenChange={setShowReplyDialog}
        onReplySuccess={handleReplySuccess}
      />

      {/* Archive Dialog */}
      <Dialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Archive Inquiry</DialogTitle>
          </DialogHeader>
          {selectedInquiry && (
            <div className="space-y-4 py-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">You are about to archive the inquiry from:</p>
                <p className="font-medium">{selectedInquiry.fullName}</p>
                <p className="text-sm text-gray-500">{selectedInquiry.subject}</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="archiveReason">Reason for archiving *</Label>
                <Textarea
                  id="archiveReason"
                  placeholder="Please provide a reason for archiving this inquiry..."
                  value={archiveReason}
                  onChange={(e) => setArchiveReason(e.target.value)}
                  rows={3}
                  maxLength={500}
                  className="resize-none"
                />
                <p className="text-xs text-gray-500">
                  {archiveReason.length}/500 characters
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowArchiveDialog(false);
                    setArchiveReason('');
                    setSelectedInquiry(null);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={confirmArchiveInquiry}
                  disabled={!archiveReason.trim() || loading}
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                >
                  {loading ? 'Archiving...' : 'Archive'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </SidebarProvider>
    </AuthGuard>
  );
}
