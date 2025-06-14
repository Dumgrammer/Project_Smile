import { useState } from 'react';
import axios from 'axios';

export const usePatientAppointments = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getPatientAppointments = async (patientId: string, sortBy: string = 'date') => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`http://localhost:8080/api/v1/appointments/patient/${patientId}?sortBy=${sortBy}`);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch patient appointments';
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