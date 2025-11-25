import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

type MetricsResponse = {
  totalRequests: number;
  uniqueVisitors: number;
  range?: {
    start: string;
    end: string;
  };
};

export const useMetrics = () => {
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_URL}/metrics`);
      setMetrics(response.data);
    } catch (err) {
      console.error('Failed to fetch metrics', err);
      setError('Unable to load site metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return {
    metrics,
    loading,
    error,
    refetch: fetchMetrics,
  };
};
