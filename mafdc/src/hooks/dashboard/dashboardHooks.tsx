import { useEffect, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

export interface DashboardStats {
  totalVisitors: number;
  activePatients: number;
  totalRevenue: number;
  growthRate: number;
}

export interface ActivityTrendPoint {
  date: string;
  treatedPatients: number;
  scheduledAppointments: number;
  inquiries: number;
}

interface ApiError {
  message: string;
  response?: {
    data?: {
      message?: string;
    };
  };
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

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get('/admin/dashboard/stats');
        setStats(res.data);
      } catch (err: unknown) {
        const apiError = err as ApiError;
        setError(apiError.response?.data?.message || apiError.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  return { stats, loading, error };
}

export function useActivityTrend() {
  const [data, setData] = useState<ActivityTrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTrend() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get('/admin/dashboard/activity-trend');
        setData(res.data);
      } catch (err: unknown) {
        const apiError = err as ApiError;
        setError(apiError.response?.data?.message || apiError.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    fetchTrend();
  }, []);

  return { data, loading, error };
}
