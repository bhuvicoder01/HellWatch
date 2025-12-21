import axios from 'axios';

// API Base URL - Change this when you have a backend
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http:localhost:5000';

// Create axios instance with default config
export const api = axios.create({
  baseURL: API_URL,
  // withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    //add configurations
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      
    }
    return Promise.reject(error);
  }
);