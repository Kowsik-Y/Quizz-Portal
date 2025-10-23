// Test Store with Optimistic UI Updates
// Using Zustand for state management with optimistic updates

import { create } from 'zustand';
import api from '../lib/api';
import { showToast, toastHelpers } from '../lib/toast';
import { handleApiError } from '../lib/errorHandler';

interface Test {
  id: number;
  title: string;
  description: string;
  duration: number;
  total_marks: number;
  department_id: number;
  course_id: number;
  created_by: number;
  is_active: boolean;
  created_at: string;
  questions_count?: number;
}

interface Booking {
  id: number;
  test_id: number;
  user_id: number;
  slot_time: string;
  status: 'pending' | 'completed' | 'cancelled';
  created_at: string;
  test?: Test;
}

interface TestState {
  // Data
  tests: Test[];
  bookings: Booking[];
  currentTest: Test | null;
  
  // UI State
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  
  // Actions
  fetchTests: () => Promise<void>;
  fetchTestById: (id: number) => Promise<void>;
  fetchMyBookings: () => Promise<void>;
  bookTest: (testId: number, slotTime: string) => Promise<boolean>;
  cancelBooking: (bookingId: number) => Promise<boolean>;
  refreshData: () => Promise<void>;
  clearError: () => void;
}

export const useTestStore = create<TestState>((set, get) => ({
  // Initial state
  tests: [],
  bookings: [],
  currentTest: null,
  loading: false,
  refreshing: false,
  error: null,

  // Fetch all tests
  fetchTests: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/tests');
      set({ 
        tests: response.data, 
        loading: false 
      });
    } catch (error: any) {
      const errorMessage = handleApiError(error);
      set({ 
        error: errorMessage.message, 
        loading: false 
      });
      showToast.error(errorMessage.message, { title: 'Failed to load tests' });
    }
  },

  // Fetch single test
  fetchTestById: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/tests/${id}`);
      set({ 
        currentTest: response.data, 
        loading: false 
      });
    } catch (error: any) {
      const errorMessage = handleApiError(error);
      set({ 
        error: errorMessage.message, 
        loading: false 
      });
      showToast.error(errorMessage.message, { title: 'Failed to load test' });
    }
  },

  // Fetch user's bookings
  fetchMyBookings: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/bookings/my-bookings');
      set({ 
        bookings: response.data, 
        loading: false 
      });
    } catch (error: any) {
      const errorMessage = handleApiError(error);
      set({ 
        error: errorMessage.message, 
        loading: false 
      });
      showToast.error(errorMessage.message, { title: 'Failed to load bookings' });
    }
  },

  // Book a test (with optimistic update)
  bookTest: async (testId: number, slotTime: string) => {
    // Create optimistic booking
    const optimisticBooking: Booking = {
      id: Date.now(), // Temporary ID
      test_id: testId,
      user_id: 0, // Will be set by backend
      slot_time: slotTime,
      status: 'pending',
      created_at: new Date().toISOString(),
      test: get().tests.find(t => t.id === testId),
    };

    // Optimistically add to bookings
    set(state => ({
      bookings: [...state.bookings, optimisticBooking]
    }));

    // Show optimistic toast
    showToast.info('Booking test...');

    try {
      const response = await api.post('/bookings/book-test', {
        test_id: testId,
        slot_time: slotTime,
      });

      // Replace optimistic booking with real one
      set(state => ({
        bookings: state.bookings.map(b => 
          b.id === optimisticBooking.id ? response.data : b
        )
      }));

      showToast.success('Test booked successfully!');
      return true;
    } catch (error: any) {
      // Rollback optimistic update
      set(state => ({
        bookings: state.bookings.filter(b => b.id !== optimisticBooking.id)
      }));

      const errorMessage = handleApiError(error);
      showToast.error(errorMessage.message, { title: 'Failed to book test' });
      return false;
    }
  },

  // Cancel booking (with optimistic update)
  cancelBooking: async (bookingId: number) => {
    // Store original state for rollback
    const originalBookings = get().bookings;

    // Optimistically update status
    set(state => ({
      bookings: state.bookings.map(b =>
        b.id === bookingId ? { ...b, status: 'cancelled' as const } : b
      )
    }));

    showToast.info('Cancelling booking...');

    try {
      await api.post(`/bookings/${bookingId}/cancel`);

      showToast.success('Booking cancelled successfully');
      return true;
    } catch (error: any) {
      // Rollback on error
      set({ bookings: originalBookings });

      const errorMessage = handleApiError(error);
      showToast.error(errorMessage.message, { title: 'Failed to cancel booking' });
      return false;
    }
  },

  // Refresh data (pull-to-refresh)
  refreshData: async () => {
    set({ refreshing: true });
    try {
      await Promise.all([
        get().fetchTests(),
        get().fetchMyBookings(),
      ]);
    } finally {
      set({ refreshing: false });
    }
  },

  // Clear error
  clearError: () => set({ error: null }),
}));
