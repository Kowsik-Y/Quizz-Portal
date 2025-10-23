// Course Store with Optimistic UI Updates
// Manages course data with optimistic updates and caching

import { create } from 'zustand';
import api from '../lib/api';
import { showToast, toastHelpers } from '../lib/toast';
import { handleApiError } from '../lib/errorHandler';

interface Course {
  id: number;
  title: string;
  name?: string;
  code?: string;
  description: string;
  department_id: number;
  department_name?: string;
  department_code?: string;
  teacher_name?: string;
  instructor?: string;
  created_by: number;
  is_active: boolean;
  created_at: string;
  materials_count?: number;
}

interface Material {
  id: number;
  course_id: number;
  title: string;
  description: string;
  file_path: string;
  file_type: string;
  uploaded_by: number;
  created_at: string;
}

interface CourseState {
  // Data
  courses: Course[];
  currentCourse: Course | null;
  materials: Material[];
  
  // UI State
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  
  // Cache
  lastFetch: number | null;
  
  // Actions
  fetchCourses: (force?: boolean, includeInactive?: boolean) => Promise<void>;
  fetchCourseById: (id: number) => Promise<void>;
  fetchCourseMaterials: (courseId: number) => Promise<void>;
  enrollCourse: (courseId: number) => Promise<boolean>;
  unenrollCourse: (courseId: number) => Promise<boolean>;
  refreshData: () => Promise<void>;
  clearCache: () => void;
  clearError: () => void;
}

// Cache duration: 5 minutes
const CACHE_DURATION = 5 * 60 * 1000;

export const useCourseStore = create<CourseState>((set, get) => ({
  // Initial state
  courses: [],
  currentCourse: null,
  materials: [],
  loading: false,
  refreshing: false,
  error: null,
  lastFetch: null,

  // Fetch courses with caching
  fetchCourses: async (force = false, includeInactive = false) => {
    const { lastFetch, courses } = get();
    const now = Date.now();

    // Use cache if available and not expired (only for active courses)
    if (!force && !includeInactive && lastFetch && courses.length > 0 && (now - lastFetch < CACHE_DURATION)) {
      return;
    }

    set({ loading: true, error: null });
    try {
      const params = includeInactive ? { include_inactive: 'true' } : {};
      const response = await api.get('/courses', { params });
      
      // Backend returns { courses: [...] }
      const coursesData = response.data.courses || response.data;
      
      set({ 
        courses: coursesData,
        loading: false,
        lastFetch: now,
      });
    } catch (error: any) {
      const errorMessage = handleApiError(error);
      set({ 
        error: errorMessage.message,
        loading: false 
      });
      showToast.error(errorMessage.message, { title: 'Failed to load courses' });
    }
  },

  // Fetch single course
  fetchCourseById: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/courses/${id}`);
      // Backend returns { course: {...}, tests: [...] }
      const courseData = response.data.course || response.data;
      set({ 
        currentCourse: courseData,
        loading: false 
      });
    } catch (error: any) {
      const errorMessage = handleApiError(error);
      set({ 
        error: errorMessage.message,
        loading: false 
      });
      showToast.error(errorMessage.message, { title: 'Failed to load course' });
    }
  },

  // Fetch course materials
  fetchCourseMaterials: async (courseId: number) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/courses/${courseId}/materials`);
      set({ 
        materials: response.data,
        loading: false 
      });
    } catch (error: any) {
      const errorMessage = handleApiError(error);
      set({ 
        error: errorMessage.message,
        loading: false 
      });
      showToast.error(errorMessage.message, { title: 'Failed to load materials' });
    }
  },

  // Enroll in course (optimistic update)
  enrollCourse: async (courseId: number) => {
    // Optimistically update enrollment count
    set(state => ({
      courses: state.courses.map(c =>
        c.id === courseId 
          ? { ...c, is_enrolled: true }
          : c
      ),
      currentCourse: state.currentCourse?.id === courseId
        ? { ...state.currentCourse, is_enrolled: true }
        : state.currentCourse
    }));

    showToast.info('Enrolling in course...');

    try {
      await api.post(`/courses/${courseId}/enroll`);
      showToast.success('Successfully enrolled in the course!');
      return true;
    } catch (error: any) {
      // Rollback on error
      set(state => ({
        courses: state.courses.map(c =>
          c.id === courseId 
            ? { ...c, is_enrolled: false }
            : c
        ),
        currentCourse: state.currentCourse?.id === courseId
          ? { ...state.currentCourse, is_enrolled: false }
          : state.currentCourse
      }));

      const errorMessage = handleApiError(error);
      showToast.error(errorMessage.message, { title: 'Failed to enroll' });
      return false;
    }
  },

  // Unenroll from course (optimistic update)
  unenrollCourse: async (courseId: number) => {
    // Optimistically update
    set(state => ({
      courses: state.courses.map(c =>
        c.id === courseId 
          ? { ...c, is_enrolled: false }
          : c
      ),
      currentCourse: state.currentCourse?.id === courseId
        ? { ...state.currentCourse, is_enrolled: false }
        : state.currentCourse
    }));

    showToast.info('Unenrolling from course...');

    try {
      await api.post(`/courses/${courseId}/unenroll`);
      showToast.success('Successfully unenrolled from the course');
      return true;
    } catch (error: any) {
      // Rollback on error
      set(state => ({
        courses: state.courses.map(c =>
          c.id === courseId 
            ? { ...c, is_enrolled: true }
            : c
        ),
        currentCourse: state.currentCourse?.id === courseId
          ? { ...state.currentCourse, is_enrolled: true }
          : state.currentCourse
      }));

      const errorMessage = handleApiError(error);
      showToast.error(errorMessage.message, { title: 'Failed to unenroll' });
      return false;
    }
  },

  // Refresh data (pull-to-refresh)
  refreshData: async () => {
    set({ refreshing: true });
    try {
      await get().fetchCourses(true);
    } finally {
      set({ refreshing: false });
    }
  },

  // Clear cache
  clearCache: () => set({ lastFetch: null }),

  // Clear error
  clearError: () => set({ error: null }),
}));
