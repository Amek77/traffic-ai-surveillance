import axios from 'axios';
import { mockViolations, mockAnalytics, mockUser, mockAdminUser } from './mockData';

// Check if we're in mock mode (useful for frontend-only deployment)
const MOCK_MODE = import.meta.env.VITE_MOCK_API === 'true' || !import.meta.env.VITE_API_URL;
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: MOCK_MODE ? 'https://api.mock' : baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Mock data storage
let mockAuthToken = localStorage.getItem('token') || 'mock_token_' + Math.random().toString(36);
let mockViolationsList = mockViolations;

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || mockAuthToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for mock API
if (MOCK_MODE) {
  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const config = error.config;
      
      // Mock API responses based on endpoint
      if (config.url.includes('/violations')) {
        if (config.method === 'get') {
          // GET violations
          return Promise.resolve({
            data: { success: true, violations: mockViolationsList },
            status: 200,
            statusText: 'OK',
            config,
          });
        }
      }
      
      if (config.url.includes('/analytics')) {
        return Promise.resolve({
          data: { success: true, ...mockAnalytics },
          status: 200,
          statusText: 'OK',
          config,
        });
      }
      
      if (config.url.includes('/auth/login')) {
        const { email, password } = JSON.parse(config.data);
        if (email && password) {
          localStorage.setItem('token', mockAuthToken);
          return Promise.resolve({
            data: { 
              success: true, 
              token: mockAuthToken, 
              user: email.includes('admin') ? mockAdminUser : mockUser 
            },
            status: 200,
            statusText: 'OK',
            config,
          });
        }
      }
      
      if (config.url.includes('/auth/register')) {
        localStorage.setItem('token', mockAuthToken);
        return Promise.resolve({
          data: { success: true, token: mockAuthToken, user: mockUser },
          status: 201,
          statusText: 'Created',
          config,
        });
      }
      
      // Default mock response
      return Promise.resolve({
        data: { success: true, message: 'Mock API response' },
        status: 200,
        statusText: 'OK',
        config,
      });
    }
  );
}

export default api;
