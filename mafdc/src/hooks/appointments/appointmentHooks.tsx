import { useState } from 'react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export interface Appointment {
  _id: string;
  patient: {
    _id: string;
    firstName: string;
    lastName: string;
    middleName?: string;
  };
  date: string;
  startTime: string;
  endTime: string;
  status: 'Scheduled' | 'Finished' | 'Rescheduled' | 'Cancelled';
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}

export const useAppointments = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createAppointment = async (appointmentData: {
    patientId: string;
    date: string;
    startTime: string;
    endTime: string;
    title: string;
  }) => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.post(`${API_URL}/appointments`, appointmentData);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create appointment');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getAppointments = async (filters?: { date?: string; status?: string }) => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (filters?.date) params.append('date', filters.date);
      if (filters?.status) params.append('status', filters.status);

      const response = await axios.get(`${API_URL}/appointments?${params.toString()}`);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch appointments');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getArchivedAppointments = async (filters?: { date?: string }) => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (filters?.date) params.append('date', filters.date);

      const response = await axios.get(`${API_URL}/appointments/archived?${params.toString()}`);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch archived appointments');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getAppointmentById = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_URL}/appointments/${id}`);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch appointment');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateAppointment = async (
    id: string,
    updateData: {
      date?: string;
      startTime?: string;
      endTime?: string;
      status?: 'Scheduled' | 'Finished' | 'Rescheduled' | 'Cancelled';
      title?: string;
    }
  ) => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.put(`${API_URL}/appointments/${id}`, updateData);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update appointment');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const cancelAppointment = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.delete(`${API_URL}/appointments/${id}`);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to cancel appointment');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getAvailableSlots = async (date: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_URL}/appointments/slots/${date}`);
      return response.data as TimeSlot[];
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch available slots');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    createAppointment,
    getAppointments,
    getArchivedAppointments,
    getAppointmentById,
    updateAppointment,
    cancelAppointment,
    getAvailableSlots,
  };
};
