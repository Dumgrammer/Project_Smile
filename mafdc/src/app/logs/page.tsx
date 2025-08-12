'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  RefreshCw, 
  Filter, 
  Eye, 
  Calendar,
  User,
  Activity,
  Database,
  BarChart3
} from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { useLogs } from "@/hooks/logs/logsHooks";
import { Log, LogAction, EntityType, LogStats } from "@/interface/logs";
import { toast } from "sonner";

export default function LogsPage() {
  const { isLoading: authLoading } = useAuth(true); // Require authentication
  const { 
    getLogs, 
    getLogStats,
    loading 
  } = useLogs();
  
  const [logs, setLogs] = useState<Log[]>([]);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);
  const [showLogDialog, setShowLogDialog] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    action: '',
    entityType: '',
    startDate: '',
    endDate: ''
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);

  const getActionBadgeVariant = (action: LogAction) => {
    if (action.includes('DELETED')) return 'destructive';
    if (action.includes('ARCHIVED')) return 'secondary';
    if (action.includes('RESTORED') || action.includes('CREATED')) return 'default';
    if (action.includes('UPDATED') || action.includes('REPLIED')) return 'outline';
    return 'secondary';
  };

  const getEntityBadgeColor = (entityType: EntityType) => {
    switch (entityType) {
      case 'inquiry': return 'bg-blue-100 text-blue-800';
      case 'appointment': return 'bg-green-100 text-green-800';
      case 'patient': return 'bg-purple-100 text-purple-800';
      case 'admin': return 'bg-orange-100 text-orange-800';
      case 'system': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
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

  const formatAction = (action: LogAction) => {
    return action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatDetailKey = (key: string) => {
    // Convert camelCase to readable text
    return key
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
      .trim();
  };

  const formatDetailValue = (value: any): string => {
    if (value === null || value === undefined) {
      return 'Not specified';
    }
    
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    
    return String(value);
  };

  const renderLogDetails = (details: Record<string, any>) => {
    const entries = Object.entries(details);
    
    if (entries.length === 0) {
      return <p className="text-gray-500 italic">No additional details</p>;
    }

    return (
      <div className="space-y-3">
        {entries.map(([key, value]) => (
          <div key={key} className="flex flex-col sm:flex-row sm:items-start gap-2">
            <div className="sm:w-1/3">
              <span className="text-sm font-medium text-gray-600">
                {formatDetailKey(key)}:
              </span>
            </div>
            <div className="sm:w-2/3">
              <span className="text-sm text-gray-900 break-words">
                {formatDetailValue(value)}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Fetch logs on component mount
  useEffect(() => {
    if (!authLoading) {
      fetchLogs();
      fetchStats();
    }
  }, [authLoading, filters]);

  const fetchLogs = async () => {
    setRefreshing(true);
    try {
      const filterParams = {
        ...filters,
        action: (filters.action === 'all' || filters.action === '') ? undefined : filters.action as LogAction,
        entityType: (filters.entityType === 'all' || filters.entityType === '') ? undefined : filters.entityType as EntityType
      };

      const result = await getLogs(filterParams);
      if (result.success && result.data) {
        const mappedLogs = result.data.logs.map(log => ({
          ...log,
          id: log._id || log.id
        }));
        setLogs(mappedLogs);
        setCurrentPage(result.data.currentPage);
        setTotalPages(result.data.totalPages);
        setTotalLogs(result.data.total);
      } else {
        toast.error(result.error || 'Failed to fetch logs');
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast.error('Failed to fetch logs');
    } finally {
      setRefreshing(false);
    }
  };

  const fetchStats = async () => {
    try {
      const result = await getLogStats();
      if (result.success && result.data) {
        setStats(result.data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleViewLog = (log: Log) => {
    setSelectedLog(log);
    setShowLogDialog(true);
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ 
      ...prev, 
      [key]: value,
      page: 1 // Reset to first page when filters change
    }));
  };



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
                  <h1 className="text-2xl sm:text-3xl font-bold">System Logs</h1>
                  <p className="text-slate-600 text-sm sm:text-base">Monitor admin activities and system events</p>
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
                    onClick={fetchLogs}
                    disabled={refreshing}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                    {refreshing ? 'Refreshing...' : 'Refresh'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Statistics Cards */}
            {stats && (
              <div className="px-4 lg:px-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
                      <Database className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.total}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Today's Activity</CardTitle>
                      <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.today}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Most Common Action</CardTitle>
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {stats.byAction.length > 0 
                          ? formatAction(stats.byAction[0]._id)
                          : 'N/A'
                        }
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

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
                        <Label htmlFor="action-filter">Action</Label>
                        <Select value={filters.action} onValueChange={(value) => handleFilterChange('action', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="All actions" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Actions</SelectItem>
                            <SelectItem value="INQUIRY_STATUS_UPDATED">Status Updated</SelectItem>
                            <SelectItem value="INQUIRY_ARCHIVED">Archived</SelectItem>
                            <SelectItem value="INQUIRY_RESTORED">Restored</SelectItem>
                            <SelectItem value="INQUIRY_DELETED">Deleted</SelectItem>
                            <SelectItem value="INQUIRY_REPLIED">Replied</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="entity-filter">Entity Type</Label>
                        <Select value={filters.entityType} onValueChange={(value) => handleFilterChange('entityType', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="All entities" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Entities</SelectItem>
                            <SelectItem value="inquiry">Inquiry</SelectItem>
                            <SelectItem value="appointment">Appointment</SelectItem>
                            <SelectItem value="patient">Patient</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="system">System</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="start-date">Start Date</Label>
                        <Input
                          id="start-date"
                          type="date"
                          value={filters.startDate}
                          onChange={(e) => handleFilterChange('startDate', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="end-date">End Date</Label>
                        <Input
                          id="end-date"
                          type="date"
                          value={filters.endDate}
                          onChange={(e) => handleFilterChange('endDate', e.target.value)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            
            <div className="px-4 lg:px-6">
                             {/* Logs Table */}
               <Card>
                 <CardHeader>
                   <CardTitle>Activity Logs</CardTitle>
                 </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Admin</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Entity</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-500" />
                              <span className="text-sm">{formatDate(log.createdAt)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-500" />
                              <span className="font-medium">{log.adminName}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getActionBadgeVariant(log.action)}>
                              {formatAction(log.action)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge className={getEntityBadgeColor(log.entityType)}>
                                {log.entityType}
                              </Badge>
                              {log.entityName && (
                                <span className="text-sm text-gray-500 truncate max-w-[150px]">
                                  {log.entityName}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm truncate max-w-[200px] block">
                              {log.description}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleViewLog(log)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {logs.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                            No logs found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-gray-500">
                        Showing {Math.min((currentPage - 1) * filters.limit + 1, totalLogs)} to{' '}
                        {Math.min(currentPage * filters.limit, totalLogs)} of {totalLogs} logs
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </Button>
                        <span className="flex items-center px-3 text-sm">
                          Page {currentPage} of {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </SidebarInset>

      {/* Log Details Dialog */}
      <Dialog open={showLogDialog} onOpenChange={setShowLogDialog}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Log Details</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-6 py-4">
              {/* Basic Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Timestamp</p>
                    <p className="font-medium">{formatDate(selectedLog.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Admin</p>
                    <p className="font-medium">{selectedLog.adminName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Action</p>
                    <Badge variant={getActionBadgeVariant(selectedLog.action)}>
                      {formatAction(selectedLog.action)}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Entity</p>
                    <Badge className={getEntityBadgeColor(selectedLog.entityType)}>
                      {selectedLog.entityType}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Description</h3>
                <div className="bg-white border rounded-lg p-4">
                  <p className="text-gray-900">{selectedLog.description}</p>
                </div>
              </div>

                             {/* Details */}
               <div>
                 <h3 className="font-semibold text-gray-900 mb-3">Details</h3>
                 <div className="bg-white border rounded-lg p-4">
                   {renderLogDetails(selectedLog.details || {})}
                 </div>
               </div>

              {/* Actions */}
              <div className="flex justify-end pt-4 border-t">
                <Button variant="outline" onClick={() => setShowLogDialog(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
