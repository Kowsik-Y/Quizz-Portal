import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import type {
  LoginRequest,
  RegisterRequest,
  User,
  CreateCourseRequest,
  CreateTestRequest,
  CreateQuestionRequest,
  StartAttemptRequest,
  SubmitAnswerRequest,
  MarkCodeCorrectRequest,
  ExecuteCodeRequest,
  CreateMaterialRequest,
  CreateBookingRequest,
} from './types';

// API Base URL - Update for production
export const API_URL = process.env.EXPO_PUBLIC_API_URL;
// Generate User-Agent for mobile apps
const getUserAgent = () => {
  if (Platform.OS === 'web') {
    return undefined; // Web will use browser's user agent
  }

  const osName = Platform.OS === 'android' ? 'Android' : 'iOS';
  const osVersion = Platform.Version?.toString() || 'Unknown';
  const deviceModel = Device.modelName || Device.deviceName || 'Unknown Device';
  const brand = Device.brand || '';
  const deviceName = brand && deviceModel ? `${brand} ${deviceModel}` : deviceModel;
  const userAgent = `QuizPortal/1.0 (${osName} ${osVersion}; ${deviceName})`;
  return userAgent;
};

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    ...(Platform.OS !== 'web' && { 'User-Agent': getUserAgent() }),
  },
  withCredentials: true, // Enable cookies
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - session expired or invalid
      // The app will redirect to login via ProtectedRoute
      console.log('Unauthorized request - session may have expired');
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: (data: RegisterRequest) => api.post('/auth/register', data),
  login: (data: LoginRequest) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
};

// User APIs (Admin only)
export const userAPI = {
  getAll: () => api.get('/users'),
  getById: (id: number) => api.get(`/users/${id}`),
  update: (id: number, data: Partial<User>) => api.put(`/users/${id}`, data),
  delete: (id: number) => api.delete(`/users/${id}`),
  toggleStatus: (id: number) => api.patch(`/users/${id}/toggle-status`),
};

// Department APIs
export const departmentAPI = {
  getAll: () => api.get('/departments'),
};

// Course APIs
export const courseAPI = {
  getAll: (params?: { department_id?: number }) => api.get('/courses', { params }),
  getById: (id: number) => api.get(`/courses/${id}`),
  create: (data: CreateCourseRequest) => api.post('/courses', data),
  update: (id: number, data: Partial<CreateCourseRequest>) => api.put(`/courses/${id}`, data),
  delete: (id: number) => api.delete(`/courses/${id}`),
};

// Test APIs
export const testAPI = {
  getByCourse: (courseId: number) => api.get(`/tests?course_id=${courseId}`),
  getById: (id: number) => api.get(`/tests/${id}`),
  create: (data: CreateTestRequest) => api.post('/tests', data),
  update: (id: number, data: Partial<CreateTestRequest>) => api.put(`/tests/${id}`, data),
  delete: (id: number) => api.delete(`/tests/${id}`),
};

// Question APIs
export const questionAPI = {
  getAll: (params?: { test_id?: number; limit?: number; offset?: number }) => 
    api.get('/questions/all', { params }),
  getByTest: (testId: number, attemptId?: number) => {
    const params = new URLSearchParams({ test_id: testId.toString() });
    if (attemptId) {
      params.append('attempt_id', attemptId.toString());
    }
    return api.get(`/questions?${params.toString()}`);
  },
  create: (data: CreateQuestionRequest) => api.post('/questions', data),
  update: (id: number, data: Partial<CreateQuestionRequest>) => api.put(`/questions/${id}`, data),
  delete: (id: number) => api.delete(`/questions/${id}`),
};

// Attempt APIs
export const attemptAPI = {
  start: (data: StartAttemptRequest) => api.post('/attempts/start', data),
  submitAnswer: (data: SubmitAnswerRequest) => api.post('/attempts/answer', data),
  submit: (data: { attempt_id: number }) => api.post('/attempts/submit', data),
  getReview: (attemptId: number) => api.get(`/attempts/${attemptId}/review`),
  getLiveAttempts: (testId: number) => api.get(`/attempts/live?test_id=${testId}`),
  logViolation: (
    attemptId: number,
    data: {
      violation_type: string;
      details?: string;
      timestamp: string;
    }
  ) => api.post(`/attempts/${attemptId}/violation`, data),
  markCodeCorrect: (data: MarkCodeCorrectRequest) => 
    api.post('/attempts/mark-code-correct', data),
  // Student Report APIs
  getStudentAttempts: (studentId: number, testId: number) =>
    api.get(`/attempts/student/${studentId}/test/${testId}`),
  getAttemptDetail: (attemptId: number) => api.get(`/attempts/detail/${attemptId}`),
  // Teacher/Admin Report APIs
  getAccessibleTests: () => api.get('/attempts/accessible-tests'),
  getTestReport: (testId: number) => api.get(`/attempts/report/${testId}`),
};

// Code execution APIs
export const codeAPI = {
  execute: (data: ExecuteCodeRequest) => api.post('/code/execute', data),
  test: (data: ExecuteCodeRequest) => api.post('/code/test', data),
};

// Course Materials APIs
export const materialAPI = {
  getByCourse: (courseId: number) => api.get(`/materials/course/${courseId}`),
  getByTest: (testId: number) => api.get(`/materials/test/${testId}`),
  getById: (id: number) => api.get(`/materials/${id}`),
  create: (data: CreateMaterialRequest) => api.post('/materials', data),
  update: (id: number, data: Partial<CreateMaterialRequest>) => api.put(`/materials/${id}`, data),
  delete: (id: number) => api.delete(`/materials/${id}`),
};

// Test Bookings APIs
export const bookingAPI = {
  getByTest: (testId: number) => api.get(`/bookings/test/${testId}`),
  getMyBookings: () => api.get('/bookings/my-bookings'),
  create: (data: CreateBookingRequest) => api.post('/bookings', data),
  cancel: (bookingId: number) => api.put(`/bookings/${bookingId}/cancel`),
  updateStatus: (bookingId: number, status: string) =>
    api.put(`/bookings/${bookingId}/status`, { status }),
};

// Export a combined API client for easy access
export const apiClient = {
  auth: authAPI,
  users: userAPI,
  departments: departmentAPI,
  courses: courseAPI,
  tests: testAPI,
  questions: questionAPI,
  attempts: attemptAPI,
  code: codeAPI,
  materials: materialAPI,
  bookings: bookingAPI,
};

export default api;
