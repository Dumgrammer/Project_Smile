'use client';

import { useState } from 'react';
import { encrypt, decrypt } from '@/lib/crypto';
import { Inquiry, InquiryFormData, InquiryResponse, InquiryStats } from '@/interface/Inquiry';
import { publicApi, protectedApi } from '@/hooks/axiosConfig';

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


export const useInquiries = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Submit inquiry (public)
  const submitInquiry = async (inquiryData: InquiryFormData) => {
    setLoading(true);
    setError(null);

    try {
      // Encrypt the inquiry data
      const encryptedData = encrypt(inquiryData);
      
      const response = await publicApi.post('/inquiry/submit', {
        data: encryptedData
      });

      // Decrypt the response
      const decryptedResponse = decrypt(response.data.data);
      
      return {
        success: true,
        message: String(decryptedResponse.message || 'Inquiry submitted successfully'),
        inquiryId: String(decryptedResponse.inquiryId || ''),
        emailSent: Boolean(decryptedResponse.emailSent)
      };
    } catch (err: unknown) {
      let errorMessage = 'Failed to submit inquiry. Please try again.';
      
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
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  };

  // Get all inquiries (admin)
  const getInquiries = async (page = 1, limit = 10, status?: string, archived?: boolean) => {
    setLoading(true);
    setError(null);

    try {
      console.log('Fetching inquiries from:', '/inquiry');
      
      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      
      if (status) params.append('status', status);
      if (archived !== undefined) params.append('archived', archived.toString());
      
      const response = await protectedApi.get(`/inquiry?${params.toString()}`);
      
      // Decrypt the response
      const decryptedResponse = decrypt(response.data.data);
      
      return {
        success: true,
        data: decryptedResponse as InquiryResponse
      };
    } catch (err: unknown) {
      console.error('Error fetching inquiries:', isApiError(err) ? err.response?.status : 'unknown', isApiError(err) ? err.response?.data : 'unknown');
      let errorMessage = 'Failed to fetch inquiries.';
      
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

  // Get single inquiry (admin)
  const getInquiryById = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await protectedApi.get(`/inquiry/${id}`);
      
      // Decrypt the response
      const decryptedResponse = decrypt(response.data.data);
      
      return {
        success: true,
        inquiry: decryptedResponse.inquiry as Inquiry
      };
    } catch (err: unknown) {
      let errorMessage = 'Failed to fetch inquiry.';
      
      if (isApiError(err) && err.response?.data?.data) {
        try {
          const decryptedError = decrypt(err.response.data.data);
          errorMessage = decryptedError.error || errorMessage;
        } catch (decryptError) {
          console.error('Error decrypting error response:', decryptError);
        }
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

  // Update inquiry status (admin)
  const updateInquiryStatus = async (id: string, status: 'Unread' | 'Read' | 'Replied') => {
    setLoading(true);
    setError(null);

    try {
      // Encrypt the status data
      const encryptedData = encrypt({ status });
      
      const response = await protectedApi.put(`/inquiry/${id}/status`, {
        data: encryptedData
      });

      // Decrypt the response
      const decryptedResponse = decrypt(response.data.data);
      
      return {
        success: true,
        message: decryptedResponse.message,
        inquiry: decryptedResponse.inquiry as Inquiry
      };
    } catch (err: unknown) {
      let errorMessage = 'Failed to update inquiry status.';
      
      if (isApiError(err) && err.response?.data?.data) {
        try {
          const decryptedError = decrypt(err.response.data.data);
          errorMessage = decryptedError.error || errorMessage;
        } catch (decryptError) {
          console.error('Error decrypting error response:', decryptError);
        }
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

  // Archive inquiry (admin)
  const archiveInquiry = async (id: string, reason: string, archivedBy?: string) => {
    setLoading(true);
    setError(null);

    try {
      // Encrypt the archive data
      const encryptedData = encrypt({ reason, archivedBy });
      
      const response = await protectedApi.put(`/inquiry/${id}/archive`, {
        data: encryptedData
      });
      
      // Decrypt the response
      const decryptedResponse = decrypt(response.data.data);
      
      return {
        success: true,
        message: decryptedResponse.message,
        inquiry: decryptedResponse.inquiry as Inquiry
      };
    } catch (err: unknown) {
      let errorMessage = 'Failed to archive inquiry.';
      
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

  // Unarchive inquiry (admin)
  const unarchiveInquiry = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await protectedApi.put(`/inquiry/${id}/unarchive`);
      
      // Decrypt the response
      const decryptedResponse = decrypt(response.data.data);
      
      return {
        success: true,
        message: decryptedResponse.message,
        inquiry: decryptedResponse.inquiry as Inquiry
      };
    } catch (err: unknown) {
      let errorMessage = 'Failed to unarchive inquiry.';
      
      if (isApiError(err) && err.response?.data?.data) {
        try {
          const decryptedError = decrypt(err.response.data.data);
          errorMessage = decryptedError.error || errorMessage;
        } catch (decryptError) {
          console.error('Error decrypting error response:', decryptError);
        }
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

  // Delete inquiry (admin)
  const deleteInquiry = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await protectedApi.delete(`/inquiry/${id}`);
      
      // Decrypt the response
      const decryptedResponse = decrypt(response.data.data);
      
      return {
        success: true,
        message: decryptedResponse.message
      };
    } catch (err: unknown) {
      let errorMessage = 'Failed to delete inquiry.';
      
      if (isApiError(err) && err.response?.data?.data) {
        try {
          const decryptedError = decrypt(err.response.data.data);
          errorMessage = decryptedError.error || errorMessage;
        } catch (decryptError) {
          console.error('Error decrypting error response:', decryptError);
        }
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

  // Get inquiry statistics (admin)
  const getInquiryStats = async () => {
    setLoading(true);
    setError(null);

    try {
        const response = await protectedApi.get('/inquiry/stats');
      
      // Decrypt the response
      const decryptedResponse = decrypt(response.data.data);
      
      return {
        success: true,
        stats: decryptedResponse.stats as InquiryStats
      };
    } catch (err: unknown) {
      let errorMessage = 'Failed to fetch inquiry statistics.';
      
      if (isApiError(err) && err.response?.data?.data) {
        try {
          const decryptedError = decrypt(err.response.data.data);
          errorMessage = decryptedError.error || errorMessage;
        } catch (decryptError) {
          console.error('Error decrypting error response:', decryptError);
        }
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

  // Reply to inquiry (admin)
  const replyToInquiry = async (id: string, replyMessage: string) => {
    setLoading(true);
    setError(null);

    try {
      // Encrypt the reply data
      const encryptedData = encrypt({ replyMessage });
      
      const response = await protectedApi.post(`/inquiry/${id}/reply`, {
        data: encryptedData
      });

      // Decrypt the response
      const decryptedResponse = decrypt(response.data.data);
      
      return {
        success: true,
        message: decryptedResponse.message,
        inquiry: decryptedResponse.inquiry as Inquiry,
        emailSent: decryptedResponse.emailSent || false
      };
    } catch (err: unknown) {
      let errorMessage = 'Failed to send reply.';
      
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

  // Restore inquiry (alias for unarchive for better UX)
  const restoreInquiry = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await protectedApi.put(`/inquiry/${id}/unarchive`);
      
      // Decrypt the response
      const decryptedResponse = decrypt(response.data.data);
      
      return {
        success: true,
        message: decryptedResponse.message,
        inquiry: decryptedResponse.inquiry as Inquiry
      };
    } catch (err: unknown) {
      let errorMessage = 'Failed to restore inquiry.';
      
      if (isApiError(err) && err.response?.data?.data) {
        try {
          const decryptedError = decrypt(err.response.data.data);
          errorMessage = decryptedError.error || errorMessage;
        } catch (decryptError) {
          console.error('Error decrypting error response:', decryptError);
        }
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
    submitInquiry,
    getInquiries,
    getInquiryById,
    updateInquiryStatus,
    archiveInquiry,
    unarchiveInquiry,
    restoreInquiry,
    deleteInquiry,
    replyToInquiry,
    getInquiryStats
  };
};
