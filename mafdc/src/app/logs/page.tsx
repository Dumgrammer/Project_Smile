'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
import AuthGuard from '@/components/AuthGuard';

export default function LogsPage() {
  const { isLoading: authLoading } = useAuth(true); // Require authentication
  const { 
    getLogs, 
    getLogStats
  } = useLogs();
  
  const [logs, setLogs] = useState<Log[]>([]);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);
  const [showLogDialog, setShowLogDialog] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const statsLoadedRef = useRef(false);
  
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

  const formatDetailValue = (value: unknown): string => {
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

  const renderLogDetails = (details: Record<string, unknown>) => {
    const entries = Object.entries(details);
    
    if (entries.length === 0) {
      return <p className="text-gray-500 dark:text-gray-400 italic text-xs sm:text-sm">No additional details</p>;
    }

    return (
      <div className="space-y-2 sm:space-y-3">
        {entries.map(([key, value]) => (
          <div key={key} className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2">
            <div className="sm:w-1/3">
              <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                {formatDetailKey(key)}:
              </span>
            </div>
            <div className="sm:w-2/3">
              <span className="text-xs sm:text-sm text-gray-900 dark:text-gray-100 break-words">
                {formatDetailValue(value)}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const fetchLogs = useCallback(async () => {
    setRefreshing(true);
    try {
      const params = {
        ...filters,
        action: (filters.action === 'all' || filters.action === '') ? undefined : filters.action as LogAction,
        entityType: (filters.entityType === 'all' || filters.entityType === '') ? undefined : filters.entityType as EntityType
      };

      const result = await getLogs(params);
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
  }, [getLogs, filters]);

  const fetchStats = useCallback(async () => {
    try {
      const result = await getLogStats();
      if (result.success && result.data) {
        setStats(result.data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, [getLogStats]);

  // Fetch logs when auth is ready or filters change
  useEffect(() => {
    if (!authLoading) {
      fetchLogs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, filters]);

  // Fetch stats only once on initial load
  useEffect(() => {
    if (!authLoading && !statsLoadedRef.current) {
      fetchStats();
      statsLoadedRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading]);

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
                  <h1 className="text-2xl sm:text-3xl font-bold dark:text-white">System Logs</h1>
                  <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">Monitor admin activities and system events</p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 dark:border-gray-600 dark:hover:bg-gray-700"
                  >
                    <Filter className="h-4 w-4" />
                    Filters
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={fetchLogs}
                    disabled={refreshing}
                    className="flex items-center gap-2 dark:border-gray-600 dark:hover:bg-gray-700"
                  >
                    <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                    {refreshing ? 'Refreshing...' : 'Refresh'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Statistics Cards */}
            {stats && (
              <div id="tour-logs-stats" className="px-4 lg:px-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Card className="dark:bg-gray-800 dark:border-gray-700">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium dark:text-gray-300">Total Logs</CardTitle>
                      <Database className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold dark:text-white">{stats.total}</div>
                    </CardContent>
                  </Card>
                  <Card className="dark:bg-gray-800 dark:border-gray-700">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium dark:text-gray-300">Today&apos;s Activity</CardTitle>
                      <Activity className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold dark:text-white">{stats.today}</div>
                    </CardContent>
                  </Card>
                  <Card className="dark:bg-gray-800 dark:border-gray-700">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium dark:text-gray-300">Most Common Action</CardTitle>
                      <BarChart3 className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold dark:text-white">
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
                <Card className="mb-4 dark:bg-gray-800 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle className="dark:text-white">Filters</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <Label htmlFor="action-filter" className="dark:text-gray-300">Action</Label>
                        <Select value={filters.action} onValueChange={(value) => handleFilterChange('action', value)}>
                          <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                            <SelectValue placeholder="All actions" />
                          </SelectTrigger>
                          <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                            <SelectItem value="all" className="dark:text-gray-300 dark:hover:bg-gray-700">All Actions</SelectItem>
                            <SelectItem value="INQUIRY_STATUS_UPDATED" className="dark:text-gray-300 dark:hover:bg-gray-700">Status Updated</SelectItem>
                            <SelectItem value="INQUIRY_ARCHIVED" className="dark:text-gray-300 dark:hover:bg-gray-700">Archived</SelectItem>
                            <SelectItem value="INQUIRY_RESTORED" className="dark:text-gray-300 dark:hover:bg-gray-700">Restored</SelectItem>
                            <SelectItem value="INQUIRY_DELETED" className="dark:text-gray-300 dark:hover:bg-gray-700">Deleted</SelectItem>
                            <SelectItem value="INQUIRY_REPLIED" className="dark:text-gray-300 dark:hover:bg-gray-700">Replied</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="entity-filter" className="dark:text-gray-300">Entity Type</Label>
                        <Select value={filters.entityType} onValueChange={(value) => handleFilterChange('entityType', value)}>
                          <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                            <SelectValue placeholder="All entities" />
                          </SelectTrigger>
                          <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                            <SelectItem value="all" className="dark:text-gray-300 dark:hover:bg-gray-700">All Entities</SelectItem>
                            <SelectItem value="inquiry" className="dark:text-gray-300 dark:hover:bg-gray-700">Inquiry</SelectItem>
                            <SelectItem value="appointment" className="dark:text-gray-300 dark:hover:bg-gray-700">Appointment</SelectItem>
                            <SelectItem value="patient" className="dark:text-gray-300 dark:hover:bg-gray-700">Patient</SelectItem>
                            <SelectItem value="admin" className="dark:text-gray-300 dark:hover:bg-gray-700">Admin</SelectItem>
                            <SelectItem value="system" className="dark:text-gray-300 dark:hover:bg-gray-700">System</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="start-date" className="dark:text-gray-300">Start Date</Label>
                        <Input
                          id="start-date"
                          type="date"
                          value={filters.startDate}
                          onChange={(e) => handleFilterChange('startDate', e.target.value)}
                          className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                      <div>
                        <Label htmlFor="end-date" className="dark:text-gray-300">End Date</Label>
                        <Input
                          id="end-date"
                          type="date"
                          value={filters.endDate}
                          onChange={(e) => handleFilterChange('endDate', e.target.value)}
                          className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            
            <div className="px-4 lg:px-6">
              {/* Logs Table */}
              <Card id="tour-logs-table" className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="dark:text-white">Activity Logs</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Desktop Table */}
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="dark:text-gray-300">Timestamp</TableHead>
                          <TableHead className="dark:text-gray-300">Admin</TableHead>
                          <TableHead className="dark:text-gray-300">Action</TableHead>
                          <TableHead className="dark:text-gray-300">Entity</TableHead>
                          <TableHead className="dark:text-gray-300">Description</TableHead>
                          <TableHead className="dark:text-gray-300">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {logs.map((log) => (
                          <TableRow key={log.id} className="dark:border-gray-700">
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                <span className="text-sm dark:text-gray-300">{formatDate(log.createdAt)}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                <span className="font-medium dark:text-white">{log.adminName}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getActionBadgeVariant(log.action)} className="dark:bg-violet-700 dark:text-white dark:border-violet-600">
                                {formatAction(log.action)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Badge className={`${getEntityBadgeColor(log.entityType)} dark:bg-gray-700 dark:text-gray-300`}>
                                  {log.entityType}
                                </Badge>
                                {log.entityName && (
                                  <span className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[150px]">
                                    {log.entityName}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm dark:text-gray-300 truncate max-w-[200px] block">
                                {log.description}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleViewLog(log)}
                                className="dark:border-gray-600 dark:hover:bg-gray-700"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {logs.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-gray-500 dark:text-gray-400">
                              No logs found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="md:hidden space-y-4">
                    {logs.map((log) => (
                      <div 
                        key={log.id}
                        className="p-4 rounded-lg border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <User className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                                <h3 className="font-medium text-gray-900 dark:text-white text-sm truncate">{log.adminName}</h3>
                              </div>
                              <div className="flex items-center gap-2 mb-2">
                                <Calendar className="h-3 w-3 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                                <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(log.createdAt)}</span>
                              </div>
                            </div>
                            <div className="ml-2 flex flex-col gap-1 flex-shrink-0">
                              <Badge variant={getActionBadgeVariant(log.action)} className="text-xs dark:bg-violet-700 dark:text-white dark:border-violet-600">
                                {formatAction(log.action)}
                              </Badge>
                              <Badge className={`${getEntityBadgeColor(log.entityType)} dark:bg-gray-700 dark:text-gray-300 text-xs`}>
                                {log.entityType}
                              </Badge>
                            </div>
                          </div>
                          
                          <div>
                            {log.entityName && (
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Entity: {log.entityName}</p>
                            )}
                            <p className="text-sm text-gray-700 dark:text-gray-300">{log.description}</p>
                          </div>
                          
                          <div className="flex justify-end pt-2 border-t border-gray-200 dark:border-gray-600">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleViewLog(log)}
                              className="dark:border-gray-600 dark:hover:bg-gray-700 text-xs"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View Details
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {logs.length === 0 && (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        No logs found
                      </div>
                    )}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-4 gap-3 sm:gap-0">
                      <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        Showing {Math.min((currentPage - 1) * filters.limit + 1, totalLogs)} to{' '}
                        {Math.min(currentPage * filters.limit, totalLogs)} of {totalLogs} logs
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="dark:border-gray-600 dark:hover:bg-gray-700 text-xs sm:text-sm flex-1 sm:flex-none"
                        >
                          Previous
                        </Button>
                        <span className="flex items-center px-2 sm:px-3 text-xs sm:text-sm dark:text-gray-300 whitespace-nowrap">
                          Page {currentPage} of {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="dark:border-gray-600 dark:hover:bg-gray-700 text-xs sm:text-sm flex-1 sm:flex-none"
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
        <DialogContent className="w-full max-w-xs sm:max-w-2xl lg:max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl dark:text-white">Log Details</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4 sm:space-y-6 py-2 sm:py-4">
              {/* Basic Information */}
              <div className="bg-gray-50 dark:bg-gray-800 p-3 sm:p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm sm:text-base">Basic Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Timestamp</p>
                    <p className="font-medium text-sm sm:text-base dark:text-white">{formatDate(selectedLog.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Admin</p>
                    <p className="font-medium text-sm sm:text-base dark:text-white">{selectedLog.adminName}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Action</p>
                    <Badge variant={getActionBadgeVariant(selectedLog.action)} className="text-xs dark:bg-violet-700 dark:text-white dark:border-violet-600">
                      {formatAction(selectedLog.action)}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Entity</p>
                    <Badge className={`${getEntityBadgeColor(selectedLog.entityType)} dark:bg-gray-700 dark:text-gray-300 text-xs`}>
                      {selectedLog.entityType}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm sm:text-base">Description</h3>
                <div className="bg-white dark:bg-gray-900 border dark:border-gray-600 rounded-lg p-3 sm:p-4">
                  <p className="text-gray-900 dark:text-gray-100 text-sm sm:text-base">{selectedLog.description}</p>
                </div>
              </div>

              {/* Details */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm sm:text-base">Details</h3>
                <div className="bg-white dark:bg-gray-900 border dark:border-gray-600 rounded-lg p-3 sm:p-4">
                  {renderLogDetails(selectedLog.details || {})}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end pt-4 border-t dark:border-gray-700">
                <Button 
                  variant="outline" 
                  onClick={() => setShowLogDialog(false)}
                  className="dark:border-gray-600 dark:hover:bg-gray-700 text-xs sm:text-sm"
                >
                  Close
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
