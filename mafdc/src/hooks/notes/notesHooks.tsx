import { useState, useCallback } from 'react';
import { protectedApi } from '../axiosConfig';
import { toast } from 'sonner';
import { decrypt } from '@/lib/crypto';

// Note interface is defined but not used in this file
// It's used in the return type of getPatientNotes


interface ApiResponse {
  data: string; // encrypted data
}

export const useNotes = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getPatientNotes = useCallback(async (patientId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await protectedApi.get<ApiResponse>(`/notes/patient/${patientId}`);
      
      // Decrypt the response data
      const decryptedData = decrypt(response.data.data);
      const notes = Array.isArray(decryptedData) ? decryptedData : [];
      
      // Sort notes by date in descending order (newest first)
      const sortedNotes = notes.sort((a, b) => 
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