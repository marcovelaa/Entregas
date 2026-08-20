import { api } from '@/lib/api';
import { ApiProduct, PaginatedResponse } from '@/types/api';

export const getProducts = async (params: Record<string, any>): Promise<PaginatedResponse<ApiProduct>> => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null) {
      query.append(key, String(val));
    }
  });
  
  // If API_URL is used dynamically via env (as previous fetch did):
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  const response = await fetch(`${API_URL}/productos?${query.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch products');
  }
  const data = await response.json();
  // Ensure it matches PaginatedResponse
  return data.data ? data : { data: Array.isArray(data) ? data : [], total: 0, page: 1, limit: 50 };
};
