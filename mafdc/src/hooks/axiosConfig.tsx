import axios from 'axios';
import Cookies from 'js-cookie';

// API instance for public routes (no auth needed)
export const publicApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000,
});

// API instance for protected routes (requires auth)
export const protectedApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000,
});

// Add auth token to protected requests
protectedApi.interceptors.request.use((config) => {
  const token = Cookies.get('accessToken');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    console.log('Axios interceptor - No token found, request will fail');
  }
  return config;
});

// Response interceptor for handling common errors
protectedApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, redirect to login
      Cookies.remove('accessToken');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Optional: Add response interceptor for public API as well
publicApi.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle common public API errors if needed
    return Promise.reject(error);
  }
);
