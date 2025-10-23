// Auth Store with Zustand
// Manages authentication state and user session

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../lib/api';
import { showToast } from '../lib/toast';
import { handleApiError } from '../lib/errorHandler';
import { User } from '@/lib/types';


interface AuthState {
  // Data
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  
  // UI State
  loading: boolean;
  initializing: boolean;
  error: string | null;
  _isCheckingAuth: boolean; // Internal flag to prevent multiple simultaneous checks
  
  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, role: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<boolean>;
  checkAuth: () => Promise<void>;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial state
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  initializing: true,
  error: null,
  _isCheckingAuth: false,

  // Login
  login: async (email: string, password: string) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;

      // Save to AsyncStorage
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));

      // Update axios default headers
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      set({
        user,
        token,
        isAuthenticated: true,
        loading: false,
      });

      showToast.success(`Welcome back, ${user.name}!`);
      return true;
    } catch (error: any) {
      const errorMessage = handleApiError(error);
      set({
        error: errorMessage.message,
        loading: false,
      });
      showToast.error(errorMessage.message, { title: 'Login Failed' });
      return false;
    }
  },

  // Register
  register: async (name: string, email: string, password: string, role: string) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/auth/register', { 
        name, 
        email, 
        password, 
        role 
      });
      const { token, user } = response.data;

      // Save to AsyncStorage
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));

      // Update axios default headers
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      set({
        user,
        token,
        isAuthenticated: true,
        loading: false,
      });

      showToast.success('Welcome to the platform!', { title: 'Account Created' });
      return true;
    } catch (error: any) {
      const errorMessage = handleApiError(error);
      set({
        error: errorMessage.message,
        loading: false,
      });
      showToast.error(errorMessage.message, { title: 'Registration Failed' });
      return false;
    }
  },

  // Logout
  logout: async () => {
    try {
      // Call backend logout API to log the activity
      try {
        await api.post('/auth/logout');
      } catch (apiError) {
        console.error('Backend logout error:', apiError);
        // Continue with local logout even if API fails
      }

      // Clear AsyncStorage
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');

      // Clear axios headers
      delete api.defaults.headers.common['Authorization'];

      set({
        user: null,
        token: null,
        isAuthenticated: false,
      });

      showToast.info('See you soon!', { title: 'Logged Out' });
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  // Update profile
  updateProfile: async (data: Partial<User>) => {
    set({ loading: true, error: null });
    try {
      const response = await api.put('/auth/profile', data);
      const updatedUser = response.data.user;

      // Update AsyncStorage
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));

      set({
        user: updatedUser,
        loading: false,
      });

      showToast.success('Your changes have been saved', { title: 'Profile Updated' });
      return true;
    } catch (error: any) {
      const errorMessage = handleApiError(error);
      set({
        error: errorMessage.message,
        loading: false,
      });
      showToast.error(errorMessage.message, { title: 'Update Failed' });
      return false;
    }
  },

  // Check authentication status on app start
  checkAuth: async () => {
    // Prevent multiple simultaneous checks
    const state = get();
    if (state._isCheckingAuth) {
      return;
    }

    // If already initialized and authenticated, skip
    if (!state.initializing && state.isAuthenticated) {
      return;
    }

    set({ initializing: true, _isCheckingAuth: true });
    
    try {
      const token = await AsyncStorage.getItem('token');
      const userStr = await AsyncStorage.getItem('user');

      if (token && userStr) {
        const user = JSON.parse(userStr);

        // Set axios default headers
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        // Verify token is still valid
        try {
          const response = await api.get('/auth/me');
          const validUser = response.data.user;

          set({
            user: validUser,
            token,
            isAuthenticated: true,
            initializing: false,
            _isCheckingAuth: false,
          });
        } catch (error) {
          // Token invalid, clear storage
          await AsyncStorage.removeItem('token');
          await AsyncStorage.removeItem('user');
          set({ 
            user: null,
            token: null,
            isAuthenticated: false,
            initializing: false,
            _isCheckingAuth: false,
          });
        }
      } else {
        set({ 
          initializing: false,
          _isCheckingAuth: false,
        });
      }
    } catch (error) {
      set({ 
        initializing: false,
        _isCheckingAuth: false,
      });
    }
  },

  // Set user (for manual updates)
  setUser: (user: User) => set({ user }),

  // Set token (for manual updates)
  setToken: (token: string) => set({ token }),

  // Clear error
  clearError: () => set({ error: null }),
}));
