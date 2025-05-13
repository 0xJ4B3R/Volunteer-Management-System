import axios from 'axios';
import { User } from '@/store/slices/authSlice';
import { handleApiError } from '@/utils/api-error';
import { setToken, clearAuth, setUser } from '@/utils/auth';
import { getApiUrl } from '@/utils/env';

// Mock user data for development
const mockUsers = [
  {
    id: '1',
    username: 'manager',
    email: 'manager@example.com',
    role: 'manager' as const,
    password: 'manager123' // In a real app, this would be hashed
  },
  {
    id: '2',
    username: 'volunteer',
    email: 'volunteer@example.com',
    role: 'volunteer' as const,
    password: 'volunteer123' // In a real app, this would be hashed
  }
];

// Create axios instance
const authApi = axios.create({
  baseURL: getApiUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests if it exists
authApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add a response interceptor to handle token expiration
authApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If the error is due to an expired token and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { data } = await authApi.post('/refresh-token');
        setToken(data.token);
        
        // Retry the original request with the new token
        originalRequest.headers.Authorization = `Bearer ${data.token}`;
        return authApi(originalRequest);
      } catch (refreshError) {
        // If refresh token fails, clear auth and redirect to login
        clearAuth();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export const authService = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    try {
      // For development: simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Find user in mock data
      const user = mockUsers.find(u => 
        u.username === credentials.username && 
        u.password === credentials.password
      );

      if (!user) {
        throw new Error('Invalid username or password');
      }

      // Create a mock token
      const token = `mock-jwt-token-${user.id}`;

      // Return user data without password
      const { password, ...userWithoutPassword } = user;
      
      // Store both token and user data
      const rememberMe = true; // You can make this configurable based on user preference
      setToken(token, rememberMe);
      setUser(userWithoutPassword, rememberMe);
      
      return {
        user: userWithoutPassword,
        token
      };
    } catch (error) {
      throw handleApiError(error);
    }
  },

  logout: async (): Promise<void> => {
    try {
      // For development: simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      clearAuth();
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getCurrentUser: async (): Promise<User> => {
    try {
      // For development: simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      // Extract user ID from mock token
      const userId = token.split('-').pop();
      const user = mockUsers.find(u => u.id === userId);

      if (!user) {
        throw new Error('User not found');
      }

      // Return user data without password
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  refreshToken: async (): Promise<{ token: string }> => {
    try {
      // For development: simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      // In a real app, this would get a new token from the server
      return { token };
    } catch (error) {
      throw handleApiError(error);
    }
  },
}; 