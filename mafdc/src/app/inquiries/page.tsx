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
import { Select, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, Archive, Trash2, RefreshCw, RotateCcw, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
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

export default function InquiriesPage() {
  const { isLoading: authLoading } = useAuth(true); // Require authentication
  const { 
    getInquiries, 
    updateInquiryStatus, 
    archiveInquiry,
    restoreInquiry,
    deleteInquiry, 
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
  }, [getInquiries]);

  // Fetch inquiries on component mount only
  useEffect(() => {
    if (!authLoading) {
      fetchInquiries();
    }
  }, [authLoading]);

  // Fetch inquiries when pagination or tab changes
  useEffect(() => {
    if (!authLoading) {
      fetchInquiries();
    }
  }, [pagination.page, pagination.limit, currentTab]);

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

  const handleDeleteInquiry = async (inquiry: Inquiry) => {
    // Use toast for confirmation instead of alert
    toast.error(`Delete inquiry from ${inquiry.fullName}?`, {
      action: {
        label: 'Delete',
        onClick: async () => {
          try {
            const result = await deleteInquiry(inquiry.id);
            if (result.success) {
              // Remove from local state
              setInquiries(prev => prev.filter(inq => inq.id !== inquiry.id));
              toast.success('Inquiry deleted successfully');
            } else {
              toast.error(result.error || 'Failed to delete inquiry');
            }
          } catch (error) {
            console.error('Error deleting inquiry:', error);
            toast.error('Failed to delete inquiry');
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

  // All inquiries are now paginated from the backend, no need to filter here
  const displayedInquiries = inquiries;

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
            
            <div className="px-4 lg:px-6">
              {/* Inquiries Table with Tabs */}
              <Card>
                <CardHeader>
                  <CardTitle>Customer Inquiries</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
                    <TabsList className="mb-4 flex flex-row w-full justify-center bg-slate-100 rounded-full shadow-sm p-1 gap-2">
                      <TabsTrigger value="active" className="flex-1 px-4 py-2 text-sm font-semibold rounded-full transition data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:bg-transparent data-[state=inactive]:text-slate-600">
                        Active Messages ({currentTab === 'active' ? pagination.total : '...'})
                      </TabsTrigger>
                      <TabsTrigger value="archived" className="flex-1 px-4 py-2 text-sm font-semibold rounded-full transition data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:bg-transparent data-[state=inactive]:text-slate-600">
                        Archived Messages ({currentTab === 'archived' ? pagination.total : '...'})
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="active">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Customer</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {displayedInquiries.map((inquiry) => (
                            <TableRow 
                              key={inquiry.id} 
                              className={inquiry.status === 'Unread' ? 'bg-red-50' : ''}
                            >
                              <TableCell>
                                <div>
                                  <div className="font-medium">{inquiry.fullName}</div>
                                  <div className="text-sm text-gray-500">{inquiry.email}</div>
                                  <div className="text-sm text-gray-500">{inquiry.phone}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="max-w-xs">
                                  <div className="font-medium truncate">{inquiry.subject}</div>
                                  <div className="text-sm text-gray-500 truncate">{inquiry.message}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={getStatusBadgeVariant(inquiry.status)}>
                                  {inquiry.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm text-gray-500">
                                  {formatDate(inquiry.createdAt)}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleReadInquiry(inquiry)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleArchiveInquiry(inquiry)}
                                    disabled={loading}
                                  >
                                    <Archive className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="text-red-600 hover:text-red-700"
                                    onClick={() => handleDeleteInquiry(inquiry)}
                                    disabled={loading}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                          {displayedInquiries.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                {currentTab === 'active' ? 'No active inquiries found' : 'No archived inquiries found'}
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TabsContent>

                    <TabsContent value="archived">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Customer</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {displayedInquiries.map((inquiry) => (
                            <TableRow key={inquiry.id} className="opacity-70">
                              <TableCell>
                                <div>
                                  <div className="font-medium">{inquiry.fullName}</div>
                                  <div className="text-sm text-gray-500">{inquiry.email}</div>
                                  <div className="text-sm text-gray-500">{inquiry.phone}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="max-w-xs">
                                  <div className="font-medium truncate">{inquiry.subject}</div>
                                  <div className="text-sm text-gray-500 truncate">{inquiry.message}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={getStatusBadgeVariant(inquiry.status)}>
                                  {inquiry.status}
                                </Badge>
                                <Badge variant="secondary" className="ml-1">
                                  Archived
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm text-gray-500">
                                  {formatDate(inquiry.createdAt)}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleReadInquiry(inquiry)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    className="text-green-600 hover:text-green-700"
                                    onClick={() => handleRestoreInquiry(inquiry)}
                                    disabled={loading}
                                    title="Restore inquiry"
                                  >
                                    <RotateCcw className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="text-red-600 hover:text-red-700"
                                    onClick={() => handleDeleteInquiry(inquiry)}
                                    disabled={loading}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                          {displayedInquiries.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                No archived inquiries found
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TabsContent>
                  </Tabs>
                  
                  {/* Pagination Controls */}
                  <div className="flex items-center justify-between px-4 py-4 border-t">
                    <div className="text-slate-500 text-sm flex">
                      <span className="font-medium">{pagination.total}</span> total inquiries
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="rows-per-page" className="text-sm font-medium text-violet-600">
                          Rows per page
                        </Label>
                        <Select
                          value={`${pagination.limit}`}
                          onValueChange={(value) => handlePageSizeChange(Number(value))}
                        >
                          <SelectTrigger className="w-20 border-violet-200" id="rows-per-page">
                            <SelectValue placeholder={pagination.limit} />
                          </SelectTrigger>
                          <SelectContent side="top">
                            {[5, 10, 20, 30, 50].map((size) => (
                              <div 
                                key={size} 
                                className="hover:bg-violet-50/20 cursor-pointer px-2 py-1.5 text-sm"
                                onClick={() => handlePageSizeChange(size)}
                              >
                                {size}
                              </div>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center justify-center text-sm font-medium">
                        Page <span className="text-violet-600 mx-1 font-semibold">{pagination.page}</span> of{" "}
                        <span className="text-violet-600 mx-1 font-semibold">{pagination.totalPages}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          className="h-8 w-8 p-0 border-slate-200 hover:bg-slate-50"
                          onClick={() => handlePageChange(1)}
                          disabled={pagination.page === 1}
                        >
                          <span className="sr-only">Go to first page</span>
                          <ChevronsLeft className="text-violet-600" />
                        </Button>
                        <Button
                          variant="outline"
                          className="h-8 w-8 p-0 border-slate-200 hover:bg-slate-50"
                          onClick={() => handlePageChange(pagination.page - 1)}
                          disabled={pagination.page === 1}
                        >
                          <span className="sr-only">Go to previous page</span>
                          <ChevronLeft className="text-violet-600" />
                        </Button>
                        <Button
                          variant="outline"
                          className="h-8 w-8 p-0 border-slate-200 hover:bg-slate-50"
                          onClick={() => handlePageChange(pagination.page + 1)}
                          disabled={pagination.page >= pagination.totalPages}
                        >
                          <span className="sr-only">Go to next page</span>
                          <ChevronRight className="text-violet-600" />
                        </Button>
                        <Button
                          variant="outline"
                          className="h-8 w-8 p-0 border-slate-200 hover:bg-slate-50"
                          onClick={() => handlePageChange(pagination.totalPages)}
                          disabled={pagination.page >= pagination.totalPages}
                        >
                          <span className="sr-only">Go to last page</span>
                          <ChevronsRight className="text-violet-600" />
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
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Inquiry Details</DialogTitle>
          </DialogHeader>
          {selectedInquiry && (
            <div className="space-y-6 py-4">
              {/* Customer Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">Customer Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Full Name</p>
                    <p className="font-medium">{selectedInquiry.fullName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{selectedInquiry.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium">{selectedInquiry.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Date Received</p>
                    <p className="font-medium">{formatDate(selectedInquiry.createdAt)}</p>
                  </div>
                </div>
              </div>

              {/* Inquiry Details */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Inquiry Details</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Subject</p>
                    <p className="font-medium text-lg">{selectedInquiry.subject}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Message</p>
                    <div className="bg-white border rounded-lg p-4">
                      <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">
                        {selectedInquiry.message}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Archive Information (if archived) */}
              {selectedInquiry.isArchived && (
                <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-400">
                  <h3 className="font-semibold text-orange-900 mb-2">Archive Information</h3>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-orange-700">Reason:</p>
                      <p className="text-orange-900">{selectedInquiry.archiveReason || 'No reason provided'}</p>
                    </div>
                    {selectedInquiry.archivedAt && (
                      <div>
                        <p className="text-sm text-orange-700">Archived on:</p>
                        <p className="text-orange-900">{formatDate(selectedInquiry.archivedAt)}</p>
                      </div>
                    )}
                    {selectedInquiry.archivedBy && (
                      <div>
                        <p className="text-sm text-orange-700">Archived by:</p>
                        <p className="text-orange-900">{selectedInquiry.archivedBy}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Status and Actions */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Status:</span>
                  <Badge variant={getStatusBadgeVariant(selectedInquiry.status)}>
                    {selectedInquiry.status}
                  </Badge>
                  {selectedInquiry.isArchived && (
                    <Badge variant="secondary">Archived</Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowReadDialog(false)}>
                    Close
                  </Button>
                  <Button 
                    className="bg-violet-600 hover:bg-violet-700"
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
  );
}
