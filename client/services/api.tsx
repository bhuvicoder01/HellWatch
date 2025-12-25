import axios from 'axios';

// API Base URL - Change this when you have a backend
export const API_URL = process.env.NODE_ENV==='production' ? 'https://hellwatch-ffus.onrender.com' : 'http://localhost:5000';

// Create axios instance with default config
export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      config.headers.Authorization = localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : '';
    }
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


export const authAPI={
  login: async (credentials:any) => api.post('/auth/login', credentials),
  register:async (credentials:any) => api.post('/auth/register', credentials),
  refresh:async () => api.get('/auth/refresh'),
  getUser:async () => api.get('/auth/me'),
  updateUser:async (credentials:any) => {
    console.log(credentials.get('Avatar'))
    return await api.put('/auth/user/update', credentials,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    )},
  deactivateUser:async () => api.put('/auth/user',{isActive:false}),
  forgotPassword:async (credentials:any) => api.post('/auth/forgot-password', credentials),
  resetPassword:async (credentials:any) => api.post('/auth/reset-password', credentials),
  verifyEmail:async (credentials:any) => api.post('/auth/verify-email', credentials)
}