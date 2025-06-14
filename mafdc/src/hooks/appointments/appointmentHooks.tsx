import { useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

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

export interface AppointmentNotes {
  treatmentNotes: string;
  reminderNotes: string;
  payment: {
    amount: number;
    status: 'Paid' | 'Pending' | 'Partial';
  };
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
      
      // If we're rescheduling, set the status to Rescheduled
      if (updateData.status === 'Rescheduled' || 
          (updateData.date || updateData.startTime || updateData.endTime)) {
        updateData.status = 'Rescheduled';
      }
      
      const response = await axios.put(`${API_URL}/appointments/${id}`, updateData);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update appointment';
      setError(errorMessage);
      throw new Error(errorMessage);
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

  const completeAppointment = async (id: string, notes?: AppointmentNotes) => {
    try {
      setLoading(true);
      setError(null);
      
      // Only proceed with API calls if notes are provided
      if (notes) {
        // First complete the appointment with notes
        const response = await axios.put(`${API_URL}/appointments/${id}`, {
          status: 'Finished',
          notes: {
            treatmentNotes: notes.treatmentNotes,
            reminderNotes: notes.reminderNotes,
            payment: {
              amount: Number(notes.payment.amount),
              status: notes.payment.status
            }
          }
        });

        // Then save the notes
        const token = Cookies.get('accessToken');
        if (!token) {
          throw new Error('Please log in to save notes');
        }

        // Get appointment details for patient ID
        const appointmentResponse = await axios.get(`${API_URL}/appointments/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const appointment = appointmentResponse.data;
        if (!appointment || !appointment.patient) {
          throw new Error('Appointment not found or invalid');
        }

        // Save notes
        await axios.post(`${API_URL}/notes`, {
          appointmentId: id,
          patientId: appointment.patient._id,
          treatmentNotes: notes.treatmentNotes,
          reminderNotes: notes.reminderNotes,
          payment: {
            amount: Number(notes.payment.amount),
            status: notes.payment.status
          }
        }, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        return response.data;
      }
      
      // If no notes provided, just return success without API calls
      return { status: 'Finished' };
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to complete appointment';
      setError(errorMessage);
      throw new Error(errorMessage);
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

  const createAppointmentNotes = async (appointmentId: string, notes: AppointmentNotes) => {
    try {
      setLoading(true);
      setError(null);
      
      // Get the token from cookies
      const token = Cookies.get('accessToken');
      if (!token) {
        throw new Error('Please log in to save notes');
      }

      // First get the appointment details to get the patient ID
      const appointmentResponse = await axios.get(`${API_URL}/appointments/${appointmentId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const appointment = appointmentResponse.data;
      if (!appointment || !appointment.patient) {
        throw new Error('Appointment not found or invalid');
      }

      const response = await axios.post(`${API_URL}/notes`, {
        appointmentId,
        patientId: appointment.patient._id,
        treatmentNotes: notes.treatmentNotes,
        reminderNotes: notes.reminderNotes,
        payment: {
          amount: Number(notes.payment.amount),
          status: notes.payment.status
        }
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create appointment notes';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getAppointmentNotes = async (appointmentId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_URL}/notes/appointment/${appointmentId}`);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch appointment notes');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const rescheduleAppointment = async (
    id: string,
    updateData: {
      date: string;
      startTime: string;
      endTime: string;
      title?: string;
    }
  ) => {
    try {
      setLoading(true);
      setError(null);

      // Ensure date and time are in the correct format
      const formattedData = {
        ...updateData,
        date: updateData.date,
        startTime: updateData.startTime,
        endTime: updateData.endTime
      };

      const response = await axios.put(`${API_URL}/appointments/${id}/reschedule`, formattedData);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to reschedule appointment';
      setError(errorMessage);
      throw new Error(errorMessage);
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
    completeAppointment,
    createAppointmentNotes,
    getAppointmentNotes,
    getAvailableSlots,
    rescheduleAppointment,
  };
};
