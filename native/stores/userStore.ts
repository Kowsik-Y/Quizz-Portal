// User Store with Zustand
// Manages user-related data and statistics

import { create } from 'zustand';
import api from '../lib/api';
import { showToast } from '../lib/toast';
import { handleApiError } from '../lib/errorHandler';

interface UserStats {
  coursesEnrolled: number;
  testsCompleted: number;
  averageScore: number;
  totalScore: number;
  rank: number;
  streak: number;
  badges: number;
}

interface Achievement {
  id: number;
  title: string;
  description: string;
  icon: string;
  earned_at: string;
}

interface Progress {
  course_id: number;
  course_title: string;
  progress_percentage: number;
  completed_tests: number;
  total_tests: number;
  last_activity: string;
}

interface UserState {
  // Data
  stats: UserStats | null;
  achievements: Achievement[];
  progress: Progress[];
  recentActivity: any[];
  
  // UI State
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  
  // Actions
  fetchStats: () => Promise<void>;
  fetchAchievements: () => Promise<void>;
  fetchProgress: () => Promise<void>;
  fetchRecentActivity: () => Promise<void>;
  refreshAllData: () => Promise<void>;
  clearError: () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  // Initial state
  stats: null,
  achievements: [],
  progress: [],
  recentActivity: [],
  loading: false,
  refreshing: false,
  error: null,

  // Fetch user statistics
  fetchStats: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/users/stats');
      set({
        stats: response.data,
        loading: false,
      });
    } catch (error: any) {
      const errorMessage = handleApiError(error);
      set({
        error: errorMessage.message,
        loading: false,
      });
      // Don't show toast for stats fetch failures
      console.error('Failed to fetch stats:', errorMessage.message);
    }
  },

  // Fetch achievements
  fetchAchievements: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/users/achievements');
      set({
        achievements: response.data,
        loading: false,
      });
    } catch (error: any) {
      const errorMessage = handleApiError(error);
      set({
        error: errorMessage.message,
        loading: false,
      });
      console.error('Failed to fetch achievements:', errorMessage.message);
    }
  },

  // Fetch course progress
  fetchProgress: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/users/progress');
      set({
        progress: response.data,
        loading: false,
      });
    } catch (error: any) {
      const errorMessage = handleApiError(error);
      set({
        error: errorMessage.message,
        loading: false,
      });
      console.error('Failed to fetch progress:', errorMessage.message);
    }
  },

  // Fetch recent activity
  fetchRecentActivity: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/users/activity');
      set({
        recentActivity: response.data,
        loading: false,
      });
    } catch (error: any) {
      const errorMessage = handleApiError(error);
      set({
        error: errorMessage.message,
        loading: false,
      });
      console.error('Failed to fetch recent activity:', errorMessage.message);
    }
  },

  // Refresh all user data
  refreshAllData: async () => {
    set({ refreshing: true });
    try {
      await Promise.all([
        get().fetchStats(),
        get().fetchAchievements(),
        get().fetchProgress(),
        get().fetchRecentActivity(),
      ]);
      set({ refreshing: false });
      showToast.success('All data updated successfully', { title: 'Data Refreshed' });
    } catch (error) {
      set({ refreshing: false });
      showToast.error('Could not refresh data', { title: 'Refresh Failed' });
    }
  },

  // Clear error
  clearError: () => set({ error: null }),
}));
