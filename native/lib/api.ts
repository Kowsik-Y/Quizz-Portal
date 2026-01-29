import axios from "axios";
import * as Device from "expo-device";
import { Platform } from "react-native";
import SecureStorage from "./storage";
import type {
	CreateBookingRequest,
	CreateCourseRequest,
	CreateMaterialRequest,
	CreateQuestionRequest,
	CreateTestRequest,
	ExecuteCodeRequest,
	LoginRequest,
	MarkCodeCorrectRequest,
	RegisterRequest,
	StartAttemptRequest,
	SubmitAnswerRequest,
	User,
} from "./types";

// API Base URL - Normalize env and provide sensible defaults
const rawApiUrl = process.env.EXPO_PUBLIC_API_URL;
export const API_URL = (() => {
	if (rawApiUrl && rawApiUrl.length > 0) return rawApiUrl.replace(/\/+$/, "");
	// If running in browser, default to current origin + /api
	if (typeof window !== "undefined" && window.location) {
		return `${window.location.origin.replace(/\/+$/, "")}/api`;
	}
	// Fallback for server/dev: assume backend on localhost:5001
	return "http://localhost:5001/api";
})();
// Generate User-Agent for mobile apps
const getUserAgent = () => {
	if (Platform.OS === "web") {
		return undefined; // Web will use browser's user agent
	}

	const osName = Platform.OS === "android" ? "Android" : "iOS";
	const osVersion = Platform.Version?.toString() || "Unknown";
	const deviceModel = Device.modelName || Device.deviceName || "Unknown Device";
	const brand = Device.brand || "";
	const deviceName =
		brand && deviceModel ? `${brand} ${deviceModel}` : deviceModel;
	const userAgent = `QuizPortal/1.0 (${osName} ${osVersion}; ${deviceName})`;
	return userAgent;
};

// Create axios instance
const api = axios.create({
	baseURL: API_URL,
	timeout: 10000,
	headers: {
		"Content-Type": "application/json",
		...(Platform.OS !== "web" && { "User-Agent": getUserAgent() }),
	},
	withCredentials: true, // Enable cookies for web
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
	async (config) => {
		// Get token from secure storage (cookies for web, AsyncStorage for mobile)
		const token = await SecureStorage.getItem("auth_token");
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error) => Promise.reject(error),
);

// Response interceptor for error handling
api.interceptors.response.use(
	(response) => response,
	async (error) => {
		if (error.response?.status === 401) {
			// Unauthorized - session expired or invalid
			// Clear token and redirect to login
			await SecureStorage.removeItem("auth_token");
			console.log("Unauthorized request - session expired");
		}
		return Promise.reject(error);
	},
);

// Auth APIs
export const authAPI = {
	register: (data: RegisterRequest) => api.post("/auth/register", data),
	login: (data: LoginRequest) => api.post("/auth/login", data),
	logout: () => api.post("/auth/logout"),
	getMe: () => api.get("/auth/me"),
};

// User APIs (Admin only)
export const userAPI = {
	getAll: () => api.get("/users"),
	getById: (id: number) => api.get(`/users/${id}`),
	update: (id: number, data: Partial<User>) => api.put(`/users/${id}`, data),
	delete: (id: number) => api.delete(`/users/${id}`),
	toggleStatus: (id: number) => api.patch(`/users/${id}/toggle-status`),
};

// Department APIs
export const departmentAPI = {
	getAll: () => api.get("/departments"),
};

// Course APIs
export const courseAPI = {
	getAll: (params?: { department_id?: number }) =>
		api.get("/courses", { params }),
	getById: (id: number) => api.get(`/courses/${id}`),
	create: (data: CreateCourseRequest) => api.post("/courses", data),
	update: (id: number, data: Partial<CreateCourseRequest>) =>
		api.put(`/courses/${id}`, data),
	delete: (id: number) => api.delete(`/courses/${id}`),
};

// Test APIs
export const testAPI = {
	getByCourse: (courseId: number) => api.get(`/tests?course_id=${courseId}`),
	getById: (id: number) => api.get(`/tests/${id}`),
	create: (data: CreateTestRequest) => api.post("/tests", data),
	update: (id: number, data: Partial<CreateTestRequest>) =>
		api.put(`/tests/${id}`, data),
	delete: (id: number) => api.delete(`/tests/${id}`),
};

// Question APIs
export const questionAPI = {
	getAll: (params?: { test_id?: number; limit?: number; offset?: number }) =>
		api.get("/questions/all", { params }),
	getByTest: (testId: number, attemptId?: number) => {
		const params = new URLSearchParams({ test_id: testId.toString() });
		if (attemptId) {
			params.append("attempt_id", attemptId.toString());
		}
		return api.get(`/questions?${params.toString()}`);
	},
	create: (data: CreateQuestionRequest) => api.post("/questions", data),
	update: (id: number, data: Partial<CreateQuestionRequest>) =>
		api.put(`/questions/${id}`, data),
	delete: (id: number) => api.delete(`/questions/${id}`),
};

// Attempt APIs
export const attemptAPI = {
	start: (data: StartAttemptRequest) => api.post("/attempts/start", data),
	submitAnswer: (data: SubmitAnswerRequest) =>
		api.post("/attempts/answer", data),
	submit: (data: { attempt_id: number }) => api.post("/attempts/submit", data),
	getReview: (attemptId: number) => api.get(`/attempts/${attemptId}/review`),
	getLiveAttempts: (testId: number) =>
		api.get(`/attempts/live?test_id=${testId}`),
	logViolation: (
		attemptId: number,
		data: {
			violation_type: string;
			details?: string;
			timestamp: string;
		},
	) => api.post(`/attempts/${attemptId}/violation`, data),
	markCodeCorrect: (data: MarkCodeCorrectRequest) =>
		api.post("/attempts/mark-code-correct", data),
	// Student Report APIs
	getStudentAttempts: (studentId: number, testId: number) =>
		api.get(`/attempts/student/${studentId}/test/${testId}`),
	getAttemptDetail: (attemptId: number) =>
		api.get(`/attempts/detail/${attemptId}`),
	// Teacher/Admin Report APIs
	getAccessibleTests: () => api.get("/attempts/accessible-tests"),
	getTestReport: (testId: number) => api.get(`/attempts/report/${testId}`),
};

// Code execution APIs
export const codeAPI = {
	execute: (data: ExecuteCodeRequest) => api.post("/code/execute", data),
	test: (data: ExecuteCodeRequest) => api.post("/code/test", data),
};

// Course Materials APIs
export const materialAPI = {
	getByCourse: (courseId: number) => api.get(`/materials/course/${courseId}`),
	getByTest: (testId: number) => api.get(`/materials/test/${testId}`),
	getById: (id: number) => api.get(`/materials/${id}`),
	create: (data: CreateMaterialRequest) => api.post("/materials", data),
	update: (id: number, data: Partial<CreateMaterialRequest>) =>
		api.put(`/materials/${id}`, data),
	delete: (id: number) => api.delete(`/materials/${id}`),
};

// Test Bookings APIs
export const bookingAPI = {
	getByTest: (testId: number) => api.get(`/bookings/test/${testId}`),
	getMyBookings: () => api.get("/bookings/my-bookings"),
	create: (data: CreateBookingRequest) => api.post("/bookings", data),
	cancel: (bookingId: number) => api.put(`/bookings/${bookingId}/cancel`),
	updateStatus: (bookingId: number, status: string) =>
		api.put(`/bookings/${bookingId}/status`, { status }),
};

// Notification APIs
export const notificationAPI = {
	getAll: (params?: { limit?: number; offset?: number; is_read?: boolean }) =>
		api.get("/notifications", { params }),
	getUnreadCount: () => api.get("/notifications/unread-count"),
	markAsRead: (notificationId: number) =>
		api.put(`/notifications/${notificationId}/read`),
	markAllAsRead: () => api.put("/notifications/mark-all-read"),
	delete: (notificationId: number) =>
		api.delete(`/notifications/${notificationId}`),
	deleteAll: () => api.delete("/notifications/all"),
	// Settings
	getSettings: () => api.get("/notifications/settings"),
	updateSettings: (settings: any) =>
		api.put("/notifications/settings", settings),
	sendTest: () => api.post("/notifications/test"),
};

// Certificate APIs
export const certificateAPI = {
	getMyCertificates: () => api.get("/certificates/my-certificates"),
	getById: (id: number) => api.get(`/certificates/${id}`),
	download: (id: number) => api.get(`/certificates/${id}/download`),
	email: (id: number, data?: { to?: string }) =>
		api.post(`/certificates/${id}/email`, data),
	verify: (code: string) => api.get(`/certificates/verify/${code}`),
	generate: (data: {
		attempt_id: number;
		test_id?: number;
		certificate_type?: "pdf" | "badge" | "both";
	}) => api.post("/certificates/generate", data),
};

// Material Progress APIs
export const materialProgressAPI = {
	markViewed: (data: {
		material_id: number;
		material_type: "test" | "course";
	}) => api.post("/materials/progress", data),
	getProgress: (params?: {
		material_type?: "test" | "course";
		material_id?: number;
	}) => api.get("/materials/progress", { params }),
	updateProgress: (
		id: number,
		data: { completion_percentage?: number; last_position?: number },
	) => api.put(`/materials/progress/${id}`, data),
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
	notifications: notificationAPI,
	certificates: certificateAPI,
	materialProgress: materialProgressAPI,
};

export default api;
