import { useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import Cookies from 'js-cookie';
import { encrypt, decrypt } from '@/lib/crypto';
import { Patient, PatientResponse, CreatePatientInput } from '@/interface/patient';

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


// Create axios instance with base URL and default headers
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create public API instance for unauthenticated endpoints
const publicApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use((config) => {
  const token = Cookies.get('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('accessToken');
      Cookies.remove('adminData');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Simple encryption/decryption - just like inquiry hooks

export const usePatients = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getPatients = useCallback(async (page = 1, limit = 10, search = '', showArchived = false) => {
    try {
      setLoading(true);
      setError(null);
      
      if (search) {
        // Use POST search endpoint for search operations (public access)
        const response = await publicApi.post('/patients/search', {
          data: encrypt({
            search,
            page,
            limit,
            filters: {
              isActive: showArchived ? false : true
            }
          })
        });
        
        // Decrypt the entire response
        const decryptedResponse = decrypt(response.data.data);
        return decryptedResponse as PatientResponse;
      } else {
        // Use GET endpoint for simple pagination without search
        const response = await api.get('/patients', {
          params: { 
            page, 
            limit,
            includeArchived: showArchived ? 'true' : 'false'
          }
        });
        
        // Decrypt the entire response
        const decryptedResponse = decrypt(response.data.data);
        return decryptedResponse as PatientResponse;
      }
    } catch (err: unknown) {
      let errorMessage = 'Failed to fetch patients';
      
      if (isApiError(err) && err.response?.data?.data) {
        try {
          const decryptedError = decrypt(err.response.data.data);
          errorMessage = String(decryptedError.error || errorMessage);
        } catch (decryptError) {
          console.error('Error decrypting error response:', decryptError);
        }
      } else if (isApiError(err) && err.response?.data?.error) {
        errorMessage = String(err.response.data.error);
      } else if (isApiError(err) && err.message) {
        errorMessage = String(err.message);
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const searchPatients = useCallback(async (searchParams: {
    search?: string;
    page?: number;
    limit?: number;
    filters?: {
      gender?: string;
      ageRange?: { min?: number; max?: number };
      isActive?: boolean;
      lastVisit?: { from?: string; to?: string };
    };
  }) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await publicApi.post('/patients/search', {
        data: encrypt(searchParams)
      });
      
      // Decrypt the entire response
      const decryptedResponse = decrypt(response.data.data);
      return decryptedResponse as PatientResponse;
    } catch (err: unknown) {
      let errorMessage = 'Failed to search patients';
      
      if (isApiError(err) && err.response?.data?.data) {
        try {
          const decryptedError = decrypt(err.response.data.data);
          errorMessage = String(decryptedError.error || errorMessage);
        } catch (decryptError) {
          console.error('Error decrypting error response:', decryptError);
        }
      } else if (isApiError(err) && err.response?.data?.error) {
        errorMessage = String(err.response.data.error);
      } else if (isApiError(err) && err.message) {
        errorMessage = String(err.message);
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getPatientById = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/patients/${id}`);
      
      // Decrypt the entire response
      const decryptedResponse = decrypt(response.data.data);
      return decryptedResponse.patient as Patient;
    } catch (err: unknown) {
      let errorMessage = 'Failed to fetch patient details';
      
      if (isApiError(err) && err.response?.data?.data) {
        try {
          const decryptedError = decrypt(err.response.data.data);
          errorMessage = String(decryptedError.error || errorMessage);
        } catch (decryptError) {
          console.error('Error decrypting error response:', decryptError);
        }
      } else if (isApiError(err) && err.response?.data?.error) {
        errorMessage = String(err.response.data.error);
      } else if (isApiError(err) && err.message) {
        errorMessage = String(err.message);
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createPatient = async (patientData: CreatePatientInput) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post('/patients', {
        data: encrypt(patientData)
      });
      
      // Decrypt the entire response
      const decryptedResponse = decrypt(response.data.data);
      
      toast.success('Patient created successfully');
      return {
        success: true,
        message: String(decryptedResponse.message || 'Patient created successfully'),
        patient: decryptedResponse.patient as Patient
      };
    } catch (err: unknown) {
      let errorMessage = 'Failed to create patient';
      
      if (isApiError(err) && err.response?.data?.data) {
        try {
          const decryptedError = decrypt(err.response.data.data);
          errorMessage = String(decryptedError.error || errorMessage);
        } catch (decryptError) {
          console.error('Error decrypting error response:', decryptError);
        }
      } else if (isApiError(err) && err.response?.data?.error) {
        errorMessage = String(err.response.data.error);
      } else if (isApiError(err) && err.message) {
        errorMessage = String(err.message);
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updatePatient = async (id: string, patientData: Partial<Patient>) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.patch(`/patients/${id}`, {
        data: encrypt(patientData)
      });
      
      // Decrypt the entire response
      const decryptedResponse = decrypt(response.data.data);
      
      toast.success('Patient updated successfully');
      return {
        success: true,
        message: String(decryptedResponse.message || 'Patient updated successfully'),
        patient: decryptedResponse.patient as Patient
      };
    } catch (err: unknown) {
      let errorMessage = 'Failed to update patient';
      
      if (isApiError(err) && err.response?.data?.data) {
        try {
          const decryptedError = decrypt(err.response.data.data);
          errorMessage = String(decryptedError.error || errorMessage);
        } catch (decryptError) {
          console.error('Error decrypting error response:', decryptError);
        }
      } else if (isApiError(err) && err.response?.data?.error) {
        errorMessage = String(err.response.data.error);
      } else if (isApiError(err) && err.message) {
        errorMessage = String(err.message);
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deletePatient = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await api.delete(`/patients/${id}`);
      toast.success('Patient deleted successfully');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete patient';
      setError(errorMessage);
      toast.error('Failed to delete patient');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const hardDeletePatient = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      await api.delete(`/patients/${id}/permanent`);
      
      toast.success('Patient permanently deleted');
      return {
        success: true,
        message: 'Patient permanently deleted'
      };
    } catch (err: unknown) {
      let errorMessage = 'Failed to permanently delete patient';
      
      if (isApiError(err) && err.response?.data?.error) {
        errorMessage = String(err.response.data.error);
      } else if (isApiError(err) && err.message) {
        errorMessage = String(err.message);
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const archivePatient = async (id: string, reason: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.patch(`/patients/${id}/archive`, {
        data: encrypt({ isActive: false, reason })
      });
      
      // Decrypt the entire response
      const decryptedResponse = decrypt(response.data.data);
      
      toast.success('Patient archived successfully');
      return {
        success: true,
        message: String(decryptedResponse.message || 'Patient archived successfully'),
        patient: decryptedResponse.patient as Patient
      };
    } catch (err: unknown) {
      let errorMessage = 'Failed to archive patient';
      
      if (isApiError(err) && err.response?.data?.data) {
        try {
          const decryptedError = decrypt(err.response.data.data);
          errorMessage = String(decryptedError.error || errorMessage);
        } catch (decryptError) {
          console.error('Error decrypting error response:', decryptError);
        }
      } else if (isApiError(err) && err.response?.data?.error) {
        errorMessage = String(err.response.data.error);
      } else if (isApiError(err) && err.message) {
        errorMessage = String(err.message);
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const restorePatient = async (id: string, reason?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.patch(`/patients/${id}/restore`, {
        data: encrypt({ isActive: true, ...(reason && { reason }) })
      });
      
      // Decrypt the entire response
      const decryptedResponse = decrypt(response.data.data);
      
      toast.success('Patient restored successfully');
      return {
        success: true,
        message: String(decryptedResponse.message || 'Patient restored successfully'),
        patient: decryptedResponse.patient as Patient
      };
    } catch (err: unknown) {
      let errorMessage = 'Failed to restore patient';
      
      if (isApiError(err) && err.response?.data?.data) {
        try {
          const decryptedError = decrypt(err.response.data.data);
          errorMessage = String(decryptedError.error || errorMessage);
        } catch (decryptError) {
          console.error('Error decrypting error response:', decryptError);
        }
      } else if (isApiError(err) && err.response?.data?.error) {
        errorMessage = String(err.response.data.error);
      } else if (isApiError(err) && err.message) {
        errorMessage = String(err.message);
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const archiveMultiplePatients = async (patientIds: string[], reason: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.patch('/patients/archive-multiple', {
        data: encrypt({ patientIds, isActive: false, reason })
      });
      
      // Decrypt the entire response
      const decryptedResponse = decrypt(response.data.data);
      
      toast.success(`${patientIds.length} patients archived successfully`);
      return {
        success: true,
        message: String(decryptedResponse.message || 'Patients archived successfully'),
        updatedCount: decryptedResponse.updatedCount || patientIds.length
      };
    } catch (err: unknown) {
      let errorMessage = 'Failed to archive patients';
      
      if (isApiError(err) && err.response?.data?.data) {
        try {
          const decryptedError = decrypt(err.response.data.data);
          errorMessage = String(decryptedError.error || errorMessage);
        } catch (decryptError) {
          console.error('Error decrypting error response:', decryptError);
        }
      } else if (isApiError(err) && err.response?.data?.error) {
        errorMessage = String(err.response.data.error);
      } else if (isApiError(err) && err.message) {
        errorMessage = String(err.message);
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const restoreMultiplePatients = async (patientIds: string[], reason?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.patch('/patients/restore-multiple', {
        data: encrypt({ patientIds, isActive: true, ...(reason && { reason }) })
      });
      
      // Decrypt the entire response
      const decryptedResponse = decrypt(response.data.data);
      
      toast.success(`${patientIds.length} patients restored successfully`);
      return {
        success: true,
        message: String(decryptedResponse.message || 'Patients restored successfully'),
        updatedCount: decryptedResponse.updatedCount || patientIds.length
      };
    } catch (err: unknown) {
      let errorMessage = 'Failed to restore patients';
      
      if (isApiError(err) && err.response?.data?.data) {
        try {
          const decryptedError = decrypt(err.response.data.data);
          errorMessage = String(decryptedError.error || errorMessage);
        } catch (decryptError) {
          console.error('Error decrypting error response:', decryptError);
        }
      } else if (isApiError(err) && err.response?.data?.error) {
        errorMessage = String(err.response.data.error);
      } else if (isApiError(err) && err.message) {
        errorMessage = String(err.message);
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    getPatients,
    searchPatients,
    getPatientById,
    createPatient,
    updatePatient,
    deletePatient,
    hardDeletePatient,
    archivePatient,
    restorePatient,
    archiveMultiplePatients,
    restoreMultiplePatients,
  };
};