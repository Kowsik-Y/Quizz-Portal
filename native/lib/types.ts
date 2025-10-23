// Type definitions for Quiz Portal

export interface Department {
  id: number;
  name: string;
  code: string;
  description?: string;
  created_at?: string;
}

export interface User {
  id: number;
  email: string;
  name: string;
  full_name?: string; // Legacy support - maps to name
  role: 'admin' | 'teacher' | 'student';
  roll_number?: string;
  department: Department;
  phone?: string;
  avatar_url?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Course {
  id: number;
  title: string;
  description: string;
  code: string;
  department_id: number;
  department_name: string;
  department_code: string;
  teacher_id: number;
  teacher_name: string;
  semester?: string;
  academic_year?: string;
  is_active: boolean;
  test_count?: number;
  created_at?: string;
}

export interface Test {
  id: number;
  course_id: number;
  course_title?: string;
  title: string;
  description?: string;
  quiz_type: 'mcq' | 'code' | 'mixed';
  test_type: 'instant' | 'booking' | 'timed';
  duration_minutes: number;
  start_time?: string;
  end_time?: string;
  passing_score: number;
  total_marks: number;
  platform_restriction: 'any' | 'mobile' | 'web';
  allowed_browsers?: string[];
  max_attempts?: number;
  is_active: boolean;
  question_count?: number;
  created_at?: string;
}

export interface TestCase {
  input: string;
  expected_output: string;
}

export interface Question {
  id: number;
  test_id: number;
  question_text: string;
  question_type: 'mcq' | 'code';
  options?: string[];
  correct_answer?: string;
  test_cases?: TestCase[];
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
  order_number: number;
  explanation?: string;
  created_at?: string;
}

export interface TestAttempt {
  id: number;
  test_id: number;
  student_id: number;
  status: 'in_progress' | 'submitted';
  score: number;
  total_points: number;
  platform?: string;
  browser?: string;
  device_info?: any;
  started_at: string;
  submitted_at?: string;
}

export interface StudentAnswer {
  id: number;
  attempt_id: number;
  question_id: number;
  answer?: string;
  code_submission?: string;
  is_correct: boolean;
  is_flagged: boolean;
  points_earned: number;
  submitted_at?: string;
}

export interface AttemptReview {
  attempt: TestAttempt;
  test: Test;
  questions: Question[];
  answers: StudentAnswer[];
}

export interface CourseMaterial {
  id: number;
  course_id: number;
  title: string;
  description?: string;
  material_type: 'document' | 'video' | 'link' | 'pdf' | 'code' | 'other';
  file_url?: string;
  content?: string;
  order_number: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface TestBooking {
  id: number;
  test_id: number;
  student_id: number;
  booked_slot: string;
  status: 'booked' | 'cancelled' | 'completed';
  created_at?: string;
  test_title?: string;
  course_title?: string;
  duration_minutes?: number;
  total_marks?: number;
  student_name?: string;
  student_email?: string;
  roll_number?: string;
}

// Request/Response types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  user: User;
  token: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role?: 'admin' | 'teacher' | 'student';
  roll_number?: string;
  department_id?: number;
}

export interface CreateCourseRequest {
  title: string;
  description?: string;
  code: string;
  department_id?: number;
  semester?: string;
  academic_year?: string;
}

export interface CreateMaterialRequest {
  course_id?: number;
  test_id?: number;
  title: string;
  description?: string;
  material_type?: 'document' | 'video' | 'link' | 'pdf' | 'code' | 'other';
  file_url?: string;
  file_size?: number;
  content?: string;
  order_number?: number;
}

export interface CreateBookingRequest {
  test_id: number;
  booked_slot: string;
}

export interface CreateTestRequest {
  course_id: number;
  title: string;
  description?: string;
  quiz_type: 'mcq' | 'code' | 'mixed';
  test_type: 'instant' | 'booking' | 'timed';
  duration_minutes: number;
  start_time?: string;
  end_time?: string;
  passing_score?: number;
  total_marks?: number;
  platform_restriction?: 'any' | 'mobile' | 'web';
  allowed_browsers?: string[];
}

export interface CreateQuestionRequest {
  test_id: number;
  question_text: string;
  question_type: 'mcq' | 'code';
  options?: Array<{ text: string; is_correct: boolean }>;
  correct_answer?: string;
  test_cases?: TestCase[];
  language?: string;
  starter_code?: string;
  points?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  order_number?: number;
  explanation?: string;
}

export interface StartAttemptRequest {
  test_id: number;
  platform?: string;
  browser?: string;
  device_info?: any;
}

export interface SubmitAnswerRequest {
  attempt_id: number;
  question_id: number;
  answer?: string;
  code_submission?: string;
  is_flagged?: boolean;
}

export interface MarkCodeCorrectRequest {
  attempt_id: number;
  question_id: number;
  passed_count: number;
  total_test_cases: number;
  test_results?: Array<{
    input: string;
    expected_output: string;
    actual_output: string;
    passed: boolean;
  }>;
}

export interface ExecuteCodeRequest {
  code: string;
  language: string;
  test_cases?: TestCase[];
}

export interface ExecuteCodeResponse {
  results: {
    input: string;
    expected_output: string;
    actual_output: string;
    passed: boolean;
  }[];
  all_passed: boolean;
}
