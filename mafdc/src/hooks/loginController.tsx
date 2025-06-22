'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import axios from 'axios';
import { encrypt } from '@/lib/crypto';

// Define types
interface LoginCredentials {
  email: string;
  password: string;
}

interface AdminData {
  id: string;
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  role: string;
}

interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    admin: AdminData;
    accessToken: string;
  };
}

interface UseLoginReturn {
  login: (credentials: LoginCredentials) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function useLogin(): UseLoginReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  // Create axios instance
  const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  const storeToken = useCallback((token: string) => {
    Cookies.set('accessToken', token, { 
      expires: 1/96, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
  }, []);

  const storeAdminData = useCallback((admin: AdminData) => {
    Cookies.set('adminData', JSON.stringify(admin), { 
      expires: 7,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
  }, []);

  // Login function
  const login = useCallback(async (credentials: LoginCredentials): Promise<LoginResponse> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const encryptedPayload = encrypt(credentials);
      
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/login`, {
        payload: encryptedPayload,
      });
      
      const data = response.data;

      if (!data.success) {
        setError(data.message || 'Login failed');
        return data;
      }

      // Store token and admin data on successful login
      if (data.data) {
        storeToken(data.data.accessToken);
        storeAdminData(data.data.admin);
      }

      return data;
    } catch (error) {
      const errorMessage = axios.isAxiosError(error) 
        ? error.response?.data?.message || error.message 
        : 'Login failed';
      
      setError(errorMessage);
      return {
        success: false,
        message: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  }, [storeToken, storeAdminData]);

  // Refresh token function
  useCallback(async (): Promise<boolean> => {
    try {
      const token = Cookies.get('accessToken');
      
      if (!token) {
        return false;
      }
      
      const response = await api.post('/admin/refresh-token', {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = response.data;

      if (data.success && data.data?.accessToken) {
        storeToken(data.data.accessToken);
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      return false;
    }
  }, [api, storeToken]);

  // Logout function
  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    
    try {
      const token = Cookies.get('accessToken');
      console.log('Current token:', token);
      
      if (!token) {
        console.log('No token found, proceeding with client-side logout');
        Cookies.remove('accessToken');
        Cookies.remove('adminData');
        router.push('/login');
        return;
      }
      
      try {
        // Send the token in both the Authorization header AND the request body
        const response = await api.post(
          '/admin/logout', 
          { token: token }, // Include token in request body
          {
            headers: {
              'Authorization': `Bearer ${token}` // Also include in header for middleware
            }
          }
        );
        
        console.log('Logout response:', response.data);
        
        // Clear cookies after successful logout
        Cookies.remove('accessToken');
        Cookies.remove('adminData');
        
        // Redirect to login page
        router.push('/login');
      } catch (apiError) {
        console.error('Logout API call failed:', apiError);
        
        // Even if API call fails, still clear cookies and redirect
        console.log('Proceeding with client-side logout');
        Cookies.remove('accessToken');
        Cookies.remove('adminData');
        router.push('/login');
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Emergency fallback - make sure user is logged out client-side
      Cookies.remove('accessToken');
      Cookies.remove('adminData');
      router.push('/login');
    } finally {
      setIsLoading(false);
    }
  }, [api, router]);

  return { login, logout, isLoading, error };
}
