import { useState, useCallback } from 'react';
import axios, { AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

const getStoredToken = async (): Promise<string | null> => {
  if (Platform.OS === 'web') {
    return localStorage.getItem('session_token');
  }
  return await SecureStore.getItemAsync('session_token');
};

export const api = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useApi<T>() {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(async (
    method: 'get' | 'post' | 'put' | 'delete',
    url: string,
    data?: any
  ) => {
    setState({ data: null, loading: true, error: null });
    try {
      const response = await api[method](url, data);
      setState({ data: response.data, loading: false, error: null });
      return response.data;
    } catch (err) {
      const error = err as AxiosError<{ detail: string }>;
      const message = error.response?.data?.detail || error.message || 'An error occurred';
      setState({ data: null, loading: false, error: message });
      throw new Error(message);
    }
  }, []);

  return { ...state, execute };
}

// Specific API functions
export const listingsApi = {
  getAll: (params?: Record<string, any>) => api.get('/listings', { params }),
  getOne: (id: string) => api.get(`/listings/${id}`),
  create: (data: any) => api.post('/listings', data),
  update: (id: string, data: any) => api.put(`/listings/${id}`, data),
  delete: (id: string) => api.delete(`/listings/${id}`),
  getMy: () => api.get('/my-listings'),
};

export const profileApi = {
  get: () => api.get('/profile'),
  update: (data: any) => api.put('/profile', data),
};

export const savedListingsApi = {
  getAll: () => api.get('/saved-listings'),
  save: (id: string) => api.post(`/saved-listings/${id}`),
  unsave: (id: string) => api.delete(`/saved-listings/${id}`),
};

export const subscriptionApi = {
  getPlans: () => api.get('/subscriptions/plans'),
  subscribe: (planId: string) => api.post(`/subscriptions/subscribe?plan_id=${planId}`),
  getMy: () => api.get('/subscriptions/my'),
};

export const chatApi = {
  getConversations: () => api.get('/chat/conversations'),
  getMessages: (conversationId: string) => api.get(`/chat/messages/${conversationId}`),
  sendMessage: (data: { listing_id: string; receiver_id: string; content: string }) =>
    api.post('/chat/send', data),
};

export const verificationApi = {
  submit: (data: { emirates_id_image: string; selfie_image: string }) =>
    api.post('/verification/submit', data),
  getStatus: () => api.get('/verification/status'),
};

export const reportsApi = {
  create: (data: { reported_type: string; reported_id: string; reason: string; description?: string }) =>
    api.post('/reports', data),
};

export const adsApi = {
  getAll: (params?: { area?: string; category?: string }) => api.get('/ads', { params }),
  trackClick: (id: string) => api.post(`/ads/${id}/click`),
};

export const utilsApi = {
  getAreas: () => api.get('/areas'),
  getLifestyleOptions: () => api.get('/lifestyle-options'),
  getProfessions: () => api.get('/professions'),
};
