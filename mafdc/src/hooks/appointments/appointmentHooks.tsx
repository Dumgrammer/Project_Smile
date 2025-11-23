import { useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import { encrypt, decrypt } from '@/lib/crypto';
import { protectedApi } from '@/hooks/axiosConfig'; // Add this import
import React from 'react'; // Added missing import for React.useEffect
import { Appointment, AppointmentNotes, TimeSlot, ApiError, ApiResponse } from '@/interface/appointment';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';


export const useAppointments = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debug: Check token on hook initialization
  React.useEffect(() => {
    // Token check removed - not needed
  }, []);

  const createAppointment = useCallback(async (appointmentData: {
    patientId: string;
    date: string;
    startTime: string;
    endTime: string;
    title: string;
  }): Promise<ApiResponse<Appointment>> => {
    try {
      setLoading(true);
      setError(null);
      const response = await protectedApi.post(`/appointments`, {
        data: encrypt(appointmentData)
      });
      
      // Decrypt the response
      const decryptedData = decrypt(response.data.data);
      return decryptedData;
    } catch (error: unknown) {
      const apiError = error as ApiError;
      setError(apiError.message || 'Failed to create appointment');
      throw new Error(apiError.message || 'Failed to create appointment');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const createPublicAppointment = useCallback(async (appointmentData: {
    patientId: string;
    date: string;
    startTime: string;
    endTime: string;
    title: string;
  }): Promise<ApiResponse<Appointment>> => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.post(`${API_URL}/appointments/public`, {
        data: encrypt(appointmentData)
      });
      
      // Decrypt the response
      const decryptedData = decrypt(response.data.data);
      return decryptedData;
    } catch (error: unknown) {
      const apiError = error as ApiError;
      setError(apiError.message || 'Failed to create appointment request');
      throw new Error(apiError.message || 'Failed to create appointment request');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const getAppointments = useCallback(async (filters?: { date?: string; status?: string }) => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (filters?.date) params.append('date', filters.date);
      if (filters?.status) params.append('status', filters.status);

      const response = await protectedApi.get(`/appointments?${params.toString()}`);
      
      // Decrypt the response
      const decryptedData = decrypt(response.data.data);
      return decryptedData;
    } catch (err: unknown) {
      const apiError = err as ApiError;
      setError(apiError.response?.data?.message || apiError.message || 'Failed to fetch appointments');
      throw apiError;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  // Public version of getAppointments for online appointment page (no auth required)
  const getPublicAppointments = useCallback(async (filters?: { date?: string; status?: string }) => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (filters?.date) params.append('date', filters.date);
      if (filters?.status) params.append('status', filters.status);

      // Use public endpoint (no auth required)
      const response = await axios.get(`${API_URL}/appointments/public?${params.toString()}`);
      
      // Check if response has encrypted data
      if (response.data.data) {
        // Decrypt the response
        const decryptedData = decrypt(response.data.data);
        return decryptedData;
      } else {
        // Handle direct response (if not encrypted)
        return response.data;
      }
    } catch (err: unknown) {
      const apiError = err as ApiError;
      console.error('Error fetching public appointments:', apiError);
      // Don't throw error for public endpoint, return empty array instead
      setError(null);
      return [];
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const getArchivedAppointments = useCallback(async (filters?: { date?: string }) => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (filters?.date) params.append('date', filters.date);

      // Debug: Token check removed - not needed

      const response = await protectedApi.get(`/appointments/archived?${params.toString()}`);
      
      // Decrypt the response
      const decryptedData = decrypt(response.data.data);
      return decryptedData;
    } catch (err: unknown) {
      const apiError = err as ApiError;
      console.error('getArchivedAppointments error:', apiError);
      setError(apiError.response?.data?.message || apiError.message || 'Failed to fetch archived appointments');
      throw apiError;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const getAppointmentById = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await protectedApi.get(`/appointments/${id}`);
      
      // Decrypt the response
      const decryptedData = decrypt(response.data.data);
      return decryptedData;
    } catch (err: unknown) {
      const apiError = err as ApiError;
      setError(apiError.response?.data?.message || apiError.message || 'Failed to fetch appointment');
      throw apiError;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateAppointment = useCallback(async (
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
      
      console.log('updateAppointment called with ID:', id);
      console.log('updateAppointment data:', updateData);
      
      // Note: Backend will handle status logic automatically:
      // - Pending → Scheduled (approval)
      // - Scheduled → Rescheduled (modification)
      // - Other statuses remain unchanged
      
      const response = await protectedApi.put(`/appointments/${id}`, {
        data: encrypt(updateData)
      });
      
      // Decrypt the response
      const decryptedData = decrypt(response.data.data);
      return decryptedData;
    } catch (err: unknown) {
      const apiError = err as ApiError;
      console.error('updateAppointment error:', apiError);
      console.error('Error response:', apiError.response?.data);
      const errorMessage = apiError.response?.data?.message || apiError.message || 'Failed to update appointment';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelAppointment = useCallback(async (id: string, cancellationReason?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      let response;
      if (cancellationReason) {
        // Use PUT request to cancel with reason
        response = await protectedApi.put(`/appointments/${id}/cancel`, {
          data: encrypt({ cancellationReason })
        });
      } else {
        // Use original DELETE for cancellation without reason
        response = await protectedApi.delete(`/appointments/${id}`);
      }
      
      // Decrypt the response
      const decryptedData = decrypt(response.data.data);
      return decryptedData;
    } catch (err: unknown) {
      const apiError = err as ApiError;
      setError(apiError.response?.data?.message || apiError.message || 'Failed to cancel appointment');
      throw apiError;
    } finally {
      setLoading(false);
    }
  }, []);

  const completeAppointment = useCallback(async (id: string, notes?: AppointmentNotes) => {
    try {
      setLoading(true);
      setError(null);
      
      // First complete the appointment (change status to Finished)
      console.log('Completing appointment with ID:', id);
      const response = await protectedApi.put(`/appointments/${id}`, {
        data: encrypt({
          status: 'Finished'
        })
      });
      console.log('Appointment completion response:', response.data);

      // If notes are provided, save them separately
      if (notes) {
        // Get appointment details for patient ID
        const appointmentResponse = await protectedApi.get(`/appointments/${id}`);

        const appointment = decrypt(appointmentResponse.data.data);
        if (!appointment || !appointment.patient) {
          throw new Error('Appointment not found or invalid');
        }

        // Save notes
        console.log('Saving notes for appointment:', id);
        const notesResponse = await protectedApi.post(`/notes`, {
          data: encrypt({
            appointmentId: id,
            patientId: appointment.patient._id,
            treatmentNotes: notes.treatmentNotes,
            reminderNotes: notes.reminderNotes,
            payment: {
              status: notes.payment.status
            }
          })
        });
        console.log('Notes saved successfully:', notesResponse.data);
      }

      // Decrypt the response
      const decryptedData = decrypt(response.data.data);
      return decryptedData;
    } catch (err: unknown) {
      const apiError = err as ApiError;
      const errorMessage = apiError.response?.data?.message || apiError.message || 'Failed to complete appointment';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const getPatientAppointments = useCallback(async (patientId: string, includeHistory: boolean = false) => {
    try {
      setLoading(true);
      setError(null);
      
      // Use public endpoint for getting patient appointments (no auth required)
      const url = `${API_URL}/appointments/patient/${patientId}/public${includeHistory ? '?includeHistory=true' : ''}`;
      const response = await axios.get(url);
      
      // Check if response has encrypted data
      if (response.data.data) {
        // Decrypt the response
        const decryptedData = decrypt(response.data.data);
        return decryptedData;
      } else {
        // Handle direct response (if not encrypted)
        return response.data;
      }
    } catch (err: unknown) {
      const apiError = err as ApiError;
      console.error('Error fetching patient appointments:', apiError);
      
      // If API endpoint doesn't exist or fails, return empty array
      setError(null); // Don't set error for fallback
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getAvailableSlots = useCallback(async (date: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Attempting to fetch slots from:', `${API_URL}/appointments/slots/${date}`);
      
      // Use public endpoint for online appointments (no auth required)
      const response = await axios.get(`${API_URL}/appointments/slots/${date}`, {
        timeout: 5000, // 5 second timeout
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      console.log('API response received:', response.status);
      
      // Check if response has encrypted data
      if (response.data.data) {
        // Decrypt the response
        const decryptedData = decrypt(response.data.data);
        console.log('Decrypted slots data:', decryptedData);
        return decryptedData as TimeSlot[];
      } else {
        // Handle direct response (if not encrypted)
        console.log('Direct response data:', response.data);
        return response.data as TimeSlot[];
      }
    } catch (err: unknown) {
      const apiError = err as ApiError;
      console.error('Error fetching available slots:', apiError);

      // If API endpoint doesn't exist or fails, return default slots
      // Generate default available slots (all available)
      const defaultSlots = [];
      for (let hour = 9; hour < 17; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          defaultSlots.push({
            startTime: time,
            endTime: `${hour + (minute === 30 ? 1 : 0)}:${minute === 30 ? '00' : '30'}`,
            available: true
          });
        }
      }
      
      console.log('Returning default slots due to API error:', defaultSlots.length, 'slots');
      setError(null); // Don't set error for fallback
      return defaultSlots as TimeSlot[];
    } finally {
      setLoading(false);
    }
  }, []);

  const createAppointmentNotes = useCallback(async (appointmentId: string, notes: AppointmentNotes) => {
    try {
      setLoading(true);
      setError(null);

      // First get the appointment details to get the patient ID
      const appointmentResponse = await protectedApi.get(`/appointments/${appointmentId}`);

      const appointment = decrypt(appointmentResponse.data.data);
      if (!appointment || !appointment.patient) {
        throw new Error('Appointment not found or invalid');
      }

      const response = await protectedApi.post(`/notes`, {
        data: encrypt({
          appointmentId,
          patientId: appointment.patient._id,
          treatmentNotes: notes.treatmentNotes,
          reminderNotes: notes.reminderNotes,
          payment: {
            status: notes.payment.status
          }
        })
      });
      
      // Decrypt the response
      const decryptedData = decrypt(response.data.data);
      return decryptedData;
    } catch (err: unknown) {
      const apiError = err as ApiError;
      const errorMessage = apiError.response?.data?.message || apiError.message || 'Failed to create appointment notes';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const getAppointmentNotes = useCallback(async (appointmentId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await protectedApi.get(`/notes/appointment/${appointmentId}`);
      
      // Decrypt the response
      const decryptedData = decrypt(response.data.data);
      return decryptedData;
    } catch (err: unknown) {
      const apiError = err as ApiError;
      setError(apiError.response?.data?.message || apiError.message || 'Failed to fetch appointment notes');
      throw apiError;
    } finally {
      setLoading(false);
    }
  }, []);

  const rescheduleAppointment = useCallback(async (
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

      const response = await protectedApi.put(`/appointments/${id}/reschedule`, {
        data: encrypt(formattedData)
      });
      
      // Decrypt the response
      const decryptedData = decrypt(response.data.data);
      return decryptedData;
    } catch (err: unknown) {
      const apiError = err as ApiError;
      const errorMessage = apiError.response?.data?.message || apiError.message || 'Failed to reschedule appointment';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const getMissedAppointments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await protectedApi.get('/appointments/missed');
      
      // Decrypt the response
      const decryptedData = decrypt(response.data.data);
      return decryptedData;
    } catch (err: unknown) {
      const apiError = err as ApiError;
      setError(apiError.response?.data?.message || apiError.message || 'Failed to fetch missed appointments');
      throw apiError;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateMissedAppointments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await protectedApi.put('/appointments/missed/update');
      
      // Decrypt the response
      const decryptedData = decrypt(response.data.data);
      return decryptedData;
    } catch (err: unknown) {
      const apiError = err as ApiError;
      setError(apiError.response?.data?.message || apiError.message || 'Failed to update missed appointments');
      throw apiError;
    } finally {
      setLoading(false);
    }
  }, []);

  return useMemo(() => ({
    loading,
    error,
    createAppointment,
    createPublicAppointment,
    getAppointments,
    getPublicAppointments,
    getArchivedAppointments,
    getAppointmentById,
    updateAppointment,
    cancelAppointment,
    completeAppointment,
    createAppointmentNotes,
    getAppointmentNotes,
    getAvailableSlots,
    getPatientAppointments,
    rescheduleAppointment,
    getMissedAppointments,
    updateMissedAppointments,
  }), [
    loading,
    error,
    createAppointment,
    createPublicAppointment,
    getAppointments,
    getPublicAppointments,
    getArchivedAppointments,
    getAppointmentById,
    updateAppointment,
    cancelAppointment,
    completeAppointment,
    createAppointmentNotes,
    getAppointmentNotes,
    getAvailableSlots,
    getPatientAppointments,
    rescheduleAppointment,
    getMissedAppointments,
    updateMissedAppointments,
  ]);
};
