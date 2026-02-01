import axios from 'axios';
import { getTeacherToken, getStudentToken, clearAllTokens } from '../utils/tokenStorage';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token to every request
api.interceptors.request.use(
  async (config) => {
    // Check if dev auth bypass is enabled
    if (import.meta.env.VITE_DEV_AUTH_BYPASS === 'true') {
      console.log('🔓 Dev Auth Bypass Enabled');
    }

    // Try to get teacher token first (Clerk)
    const teacherToken = await getTeacherToken();
    if (teacherToken) {
      config.headers.Authorization = `Bearer ${teacherToken}`;
      return config;
    }

    // Otherwise try student token
    const studentToken = getStudentToken();
    if (studentToken) {
      config.headers.Authorization = `Bearer ${studentToken}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => {
    // Return successful response data
    return response.data;
  },
  (error) => {
    // Handle different error scenarios
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;

      switch (status) {
        case 401:
          // Unauthorized - clear tokens and redirect to login
          console.error('❌ Unauthorized - Token may be invalid or expired');
          clearAllTokens();
          
          // Check if we're on a student route or teacher route
          const path = window.location.pathname;
          const academySlugMatch = path.match(/^\/([^\/]+)\//);
          
          if (academySlugMatch && path.includes('/exam')) {
            // Student route - redirect to student login
            window.location.href = `/${academySlugMatch[1]}/login`;
          } else if (path.includes('/dashboard')) {
            // Teacher route - redirect to teacher login
            window.location.href = '/login';
          }
          break;

        case 403:
          console.error('❌ Forbidden - You do not have permission');
          break;

        case 404:
          console.error('❌ Not Found - Resource does not exist');
          break;

        case 409:
          console.error('❌ Conflict - Resource already exists');
          break;

        case 500:
          console.error('❌ Server Error - Something went wrong');
          break;

        default:
          console.error(`❌ Error ${status}:`, data?.message || 'Unknown error');
      }

      // Return structured error
      return Promise.reject({
        status,
        message: data?.message || data?.error || 'An error occurred',
        data: data,
      });
    } else if (error.request) {
      // Request made but no response received
      console.error('❌ Network Error - No response from server');
      return Promise.reject({
        status: 0,
        message: 'Network error. Please check your connection.',
        data: null,
      });
    } else {
      // Something else happened
      console.error('❌ Request Error:', error.message);
      return Promise.reject({
        status: -1,
        message: error.message || 'Request failed',
        data: null,
      });
    }
  }
);

// API endpoint functions

// ============================================
// AUTH ENDPOINTS
// ============================================

export const authAPI = {
  // Verify current user (teacher)
  verifyMe: () => api.get('/api/auth/me'),
};

// ============================================
// ACADEMY ENDPOINTS
// ============================================

export const academyAPI = {
  // Create new academy (teacher)
  create: (data) => api.post('/api/academy/create', data),

  // Get academy by slug (public)
  getBySlug: (slug) => api.get(`/api/academy/${slug}`),
};

// ============================================
// STUDENT ENDPOINTS
// ============================================

export const studentAPI = {
  // Create new student (teacher)
  create: (data) => api.post('/api/students/create', data),

  // Student login
  login: (data) => api.post('/api/students/login', data),

  // Get student performance
  getPerformance: () => api.get('/api/students/performance'),
};

// ============================================
// EXAM ENDPOINTS
// ============================================

export const examAPI = {
  // Create new exam (teacher)
  create: (data) => api.post('/api/exams/create', data),

  // Get all exams for academy (public) with pagination (supports abort signal for cancellation)
  getByAcademy: (academySlug, params = {}, signal) => 
    api.get(`/api/exams/academy/${academySlug}`, { params, signal }),

  // Check exam status (student)
  getStatus: (examId) => api.get(`/api/exams/${examId}/status`),

  // Start exam attempt (student)
  start: (examId) => api.post(`/api/exams/${examId}/start`),

  // Get exam questions (student)
  getQuestions: (examId) => api.get(`/api/exams/${examId}/questions`),

  // Save single answer (student)
  saveAnswer: (examId, data) => api.post(`/api/exams/${examId}/answer`, data),

  // Save all answers (student)
  saveAllAnswers: (examId, data) => api.post(`/api/exams/${examId}/answers`, data),

  // Submit exam (student)
  submit: (examId) => api.post(`/api/exams/${examId}/submit`),

  // Get exam result (student)
  getResult: (examId) => api.get(`/api/exams/${examId}/result`),
};

// ============================================
// TEACHER ENDPOINTS
// ============================================

export const teacherAPI = {
  // Get all exams for teacher's academy (supports abort signal for cancellation)
  getAcademyExams: (params = {}, signal) => 
    api.get('/api/teacher/academy/exams', { params, signal }),

  // Get all students for teacher's academy (supports abort signal for cancellation)
  getAcademyStudents: (params = {}, signal) => 
    api.get('/api/teacher/academy/students', { params, signal }),

  // Create a new student
  createStudent: (academyId, username, password) => 
    api.post('/api/students/create', { academyId, username, password }),

  // Delete a student
  deleteStudent: (studentId) => 
    api.delete(`/api/teacher/students/${studentId}`),

  // Get all students performance summary for academy (supports abort signal for cancellation)
  getAcademyStudentsPerformance: (academyId, params = {}, signal) => 
    api.get(`/api/teacher/academy/${academyId}/students-performance`, { params, signal }),

  // Get individual student performance details
  getStudentPerformanceDetails: (studentId) => 
    api.get(`/api/teacher/students/${studentId}/performance`),

  // Get exam summary with stats
  getExamSummary: (examId) => api.get(`/api/teacher/exams/${examId}/summary`),

  // Get all attempts for an exam
  getExamAttempts: (examId) => api.get(`/api/teacher/exams/${examId}/attempts`),

  // Get student performance
  getStudentPerformance: (studentId) => api.get(`/api/teacher/students/${studentId}/performance`),

  // Get detailed exam results for a specific student (question-by-question)
  getStudentExamDetails: (examId, studentId) => api.get(`/api/teacher/exams/${examId}/student/${studentId}`),
};

// Export the configured axios instance for custom requests
export default api;
