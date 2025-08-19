import { useState } from 'react';
import { protectedApi } from '../axiosConfig';
import { decrypt } from '@/lib/crypto';


interface ApiResponse {
  data: string; // encrypted data
}

interface ApiError {
  message: string;
  response?: {
    data?: {
      message?: string;
    };
  };
}

export const usePatientAppointments = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getPatientAppointments = async (patientId: string, sortBy: string = 'date') => {
    try {
      setLoading(true);
      setError(null);
      const response = await protectedApi.get<ApiResponse>(`/appointments/patient/${patientId}?sortBy=${sortBy}`);
      
      // Decrypt the response data
      const decryptedData = decrypt(response.data.data);
      const appointments = Array.isArray(decryptedData) ? decryptedData : [];
      
      return appointments;
    } catch (err: unknown) {
      const apiError = err as ApiError;
      const errorMessage = apiError.response?.data?.message || apiError.message || 'Failed to fetch patient appointments';
      setError(errorMessage);
      console.error('Error fetching patient appointments:', err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    getPatientAppointments
  };
}; 