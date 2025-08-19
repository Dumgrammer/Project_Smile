'use client';

import { useState } from 'react';
import { encrypt, decrypt } from '@/lib/crypto';
import {
  LogResponse,
  LogStatsResponse, 
  LogFilters, 
  CleanupResponse,
  LogAction,
  EntityType
} from '@/interface/logs';
import { protectedApi } from '@/hooks/axiosConfig';

// Type guard for error objects
interface ApiError {
  response?: {
    status?: number;
    data?: {
      data?: string;
      error?: string;
    };
  };
  message?: string;
}

function isApiError(err: unknown): err is ApiError {
  return err !== null && typeof err === 'object' && 'response' in err;
}

export const useLogs = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get all logs with filters
  const getLogs = async (filters: LogFilters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      
      if (filters.page) queryParams.append('page', filters.page.toString());
      if (filters.limit) queryParams.append('limit', filters.limit.toString());
      if (filters.adminId) queryParams.append('adminId', filters.adminId);
      if (filters.action) queryParams.append('action', filters.action);
      if (filters.entityType) queryParams.append('entityType', filters.entityType);
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      const response = await protectedApi.get(`/logs?${queryParams.toString()}`);
      
      // Decrypt the response
      const decryptedResponse = decrypt(response.data.data);
      
      return {
        success: true,
        data: decryptedResponse as LogResponse
      };
    } catch (err: unknown) {
      console.error('Error fetching logs:', isApiError(err) ? err.response?.status : 'unknown', isApiError(err) ? err.response?.data : 'unknown');
      let errorMessage = 'Failed to fetch logs.';
      
      if (isApiError(err) && err.response?.status === 401) {
        errorMessage = 'Unauthorized. Please log in again.';
      } else if (isApiError(err) && err.response?.data?.data) {
        try {
          const decryptedError = decrypt(err.response.data.data);
          errorMessage = String(decryptedError.error || errorMessage);
        } catch (decryptError) {
          console.error('Error decrypting error response:', decryptError);
        }
      } else if (isApiError(err) && err.response?.data?.error) {
        errorMessage = String(err.response.data.error);
      }
      
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  };

  // Get log statistics
  const getLogStats = async (adminId?: string) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (adminId) queryParams.append('adminId', adminId);

      const response = await protectedApi.get(`/logs/stats?${queryParams.toString()}`);
      
      // Decrypt the response
      const decryptedResponse = decrypt(response.data.data);
      
      return {
        success: true,
        data: decryptedResponse as LogStatsResponse
      };
    } catch (err: unknown) {
      let errorMessage = 'Failed to fetch log statistics.';
      
      if (isApiError(err) && err.response?.data?.data) {
        try {
          const decryptedError = decrypt(err.response.data.data);
          errorMessage = String(decryptedError.error || errorMessage);
        } catch (decryptError) {
          console.error('Error decrypting error response:', decryptError);
        }
      } else if (isApiError(err) && err.response?.data?.error) {
        errorMessage = String(err.response.data.error);
      }
      
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  };

  // Get logs by admin
  const getLogsByAdmin = async (adminId: string, filters: Omit<LogFilters, 'adminId'> = {}) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      
      if (filters.page) queryParams.append('page', filters.page.toString());
      if (filters.limit) queryParams.append('limit', filters.limit.toString());
      if (filters.action) queryParams.append('action', filters.action);
      if (filters.entityType) queryParams.append('entityType', filters.entityType);
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);

      const response = await protectedApi.get(`/logs/admin/${adminId}?${queryParams.toString()}`);
      
      // Decrypt the response
      const decryptedResponse = decrypt(response.data.data);
      
      return {
        success: true,
        data: decryptedResponse as LogResponse
      };
    } catch (err: unknown) {
      let errorMessage = 'Failed to fetch admin logs.';
      
      if (isApiError(err) && err.response?.data?.data) {
        try {
          const decryptedError = decrypt(err.response.data.data);
          errorMessage = String(decryptedError.error || errorMessage);
        } catch (decryptError) {
          console.error('Error decrypting error response:', decryptError);
        }
      } else if (isApiError(err) && err.response?.data?.error) {
        errorMessage = String(err.response.data.error);
      }
      
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  };

  // Get logs by entity
  const getLogsByEntity = async (entityType: EntityType, entityId: string, filters: Omit<LogFilters, 'entityType'> = {}) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      
      if (filters.page) queryParams.append('page', filters.page.toString());
      if (filters.limit) queryParams.append('limit', filters.limit.toString());
      if (filters.adminId) queryParams.append('adminId', filters.adminId);
      if (filters.action) queryParams.append('action', filters.action);
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);

      const response = await protectedApi.get(`/logs/entity/${entityType}/${entityId}?${queryParams.toString()}`);
      
      // Decrypt the response
      const decryptedResponse = decrypt(response.data.data);
      
      return {
        success: true,
        data: decryptedResponse as LogResponse
      };
    } catch (err: unknown) {
      let errorMessage = 'Failed to fetch entity logs.';
      
      if (isApiError(err) && err.response?.data?.data) {
        try {
          const decryptedError = decrypt(err.response.data.data);
          errorMessage = String(decryptedError.error || errorMessage);
        } catch (decryptError) {
          console.error('Error decrypting error response:', decryptError);
        }
      } else if (isApiError(err) && err.response?.data?.error) {
        errorMessage = String(err.response.data.error);
      }
      
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  };

  // Create a log entry (manual logging)
  const createLog = async (logData: {
    action: LogAction;
    entityType: EntityType;
    entityId: string;
    entityName?: string;
    description: string;
    details?: Record<string, unknown>;
  }) => {
    setLoading(true);
    setError(null);

    try {
      // Encrypt the log data
      const encryptedData = encrypt(logData);
      
      const response = await protectedApi.post('/logs', {
        data: encryptedData
      });

      // Decrypt the response
      const decryptedResponse = decrypt(response.data.data);
      
      return {
        success: true,
        message: String(decryptedResponse.message || 'Log created successfully'),
        logId: String(decryptedResponse.logId || '')
      };
    } catch (err: unknown) {
      let errorMessage = 'Failed to create log.';
      
      if (isApiError(err) && err.response?.data?.data) {
        try {
          const decryptedError = decrypt(err.response.data.data);
          errorMessage = String(decryptedError.error || errorMessage);
        } catch (decryptError) {
          console.error('Error decrypting error response:', decryptError);
        }
      } else if (isApiError(err) && err.response?.data?.error) {
        errorMessage = String(err.response.data.error);
      }
      
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  };

  // Clean up old logs
  const cleanupOldLogs = async (days: number = 90) => {
    setLoading(true);
    setError(null);

    try {
      const response = await protectedApi.delete(`/logs/cleanup?days=${days}`);
      
      // Decrypt the response
      const decryptedResponse = decrypt(response.data.data);
      
      return {
        success: true,
        data: decryptedResponse as CleanupResponse
      };
    } catch (err: unknown) {
      let errorMessage = 'Failed to cleanup old logs.';
      
      if (isApiError(err) && err.response?.data?.data) {
        try {
          const decryptedError = decrypt(err.response.data.data);
          errorMessage = String(decryptedError.error || errorMessage);
        } catch (decryptError) {
          console.error('Error decrypting error response:', decryptError);
        }
      } else if (isApiError(err) && err.response?.data?.error) {
        errorMessage = String(err.response.data.error);
      }
      
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    getLogs,
    getLogStats,
    getLogsByAdmin,
    getLogsByEntity,
    createLog,
    cleanupOldLogs
  };
};
