import { useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import Cookies from 'js-cookie';

interface Patient {
  _id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  birthDate: string;
  age: number;
  gender: string;
  contactNumber: string;
  email?: string;
  address?: {
    street?: string;
    city?: string;
    province?: string;
    postalCode?: string;
  };
  emergencyContact?: {
    name?: string;
    relationship?: string;
    contactNumber?: string;
  };
  allergies?: string;
  lastVisit?: string;
  isActive: boolean;
  cases: Array<{
    title: string;
    description: string;
    treatmentPlan?: string;
    status: "Active" | "Completed" | "Cancelled";
  }>;
}

interface PatientResponse {
  message: string;
  totalPatients: number;
  totalPages: number;
  currentPage: number;
  patients: Patient[];
}

type CreatePatientInput = {
  firstName: string;
  middleName?: string;
  lastName: string;
  birthDate: string;
  gender: string;
  contactNumber: string;
  email?: string;
  cases: Array<{
    title: string;
    description: string;
    treatmentPlan?: string;
    status: "Active" | "Completed" | "Cancelled";
  }>;
  address?: {
    street?: string;
    city?: string;
    province?: string;
    postalCode?: string;
  };
  emergencyContact?: {
    name?: string;
    relationship?: string;
    contactNumber?: string;
  };
  allergies?: string;
};

// Create axios instance with base URL and default headers
const api = axios.create({
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

export const usePatients = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getPatients = useCallback(async (page = 1, limit = 10, search = '') => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<PatientResponse>('/patients', {
        params: { page, limit, search }
      });
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch patients';
      setError(errorMessage);
      toast.error('Failed to fetch patients');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getPatientById = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<{ patient: Patient }>(`/patients/${id}`);
      return response.data.patient;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch patient details';
      setError(errorMessage);
      toast.error('Failed to fetch patient details');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createPatient = async (patientData: CreatePatientInput) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.post<{ message: string; patient: Patient }>('/patients', patientData);
      toast.success('Patient created successfully');
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create patient';
      setError(errorMessage);
      toast.error('Failed to create patient');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updatePatient = async (id: string, patientData: Partial<Patient>) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.patch<{ message: string; patient: Patient }>(`/patients/${id}`, patientData);
      toast.success('Patient updated successfully');
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update patient';
      setError(errorMessage);
      toast.error('Failed to update patient');
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
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete patient';
      setError(errorMessage);
      toast.error('Failed to delete patient');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    getPatients,
    getPatientById,
    createPatient,
    updatePatient,
    deletePatient,
  };
};
