import { useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import Cookies from 'js-cookie';

interface Note {
  _id: string;
  appointment: {
    date: string;
    startTime: string;
    endTime: string;
    title: string;
  };
  treatmentNotes: string;
  reminderNotes: string;
  payment: {
    amount: number;
    status: 'Paid' | 'Pending' | 'Partial';
  };
  createdBy: {
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

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

export const useNotes = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getPatientNotes = useCallback(async (patientId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<Note[]>(`/notes/patient/${patientId}`);
      // Sort notes by date in descending order (newest first)
      const sortedNotes = response.data.sort((a, b) => 
        new Date(b.appointment.date).getTime() - new Date(a.appointment.date).getTime()
      );
      return sortedNotes;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch patient notes';
      setError(errorMessage);
      toast.error('Failed to fetch patient notes');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getPatientNotes,
  };
}; 