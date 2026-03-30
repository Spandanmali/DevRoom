import { supabase } from './supabase';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const fetchWithAuth = async (endpoint, options = {}) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error on ${endpoint}:`, error);
    throw error;
  }
};

export const api = {
  createRoom: (name, language = 'javascript') => 
    fetchWithAuth('/rooms', {
      method: 'POST',
      body: JSON.stringify({ name, language })
    }),
    
  getRoom: (id) => 
    fetchWithAuth(`/rooms/${id}`),

  joinRoom: (id) => 
    fetchWithAuth(`/rooms/${id}/join`, {
      method: 'POST'
    })
};
