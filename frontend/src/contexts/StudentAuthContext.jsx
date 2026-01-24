import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  setStudentToken, 
  getStudentToken, 
  setStudentData, 
  getStudentData, 
  clearStudentData,
  checkStudentTokenExpiration 
} from '../utils/tokenStorage';
import { studentAPI } from '../services/api';

// Create context
const StudentAuthContext = createContext(null);

/**
 * Student Auth Provider
 * Manages student authentication with custom JWT tokens
 */
export const StudentAuthProvider = ({ children }) => {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize student auth on mount
  useEffect(() => {
    const initializeStudentAuth = () => {
      // Check if student token exists
      const token = getStudentToken();
      
      if (token) {
        // Check if token is expired
        const isExpired = checkStudentTokenExpiration();
        
        if (!isExpired) {
          // Token is valid, restore student data
          const cachedStudent = getStudentData();
          if (cachedStudent) {
            setStudent(cachedStudent);
          } else {
            // Token exists but no data - clear everything
            clearStudentData();
          }
        }
      }
      
      setLoading(false);
    };

    initializeStudentAuth();
  }, []);

  /**
   * Student login
   */
  const login = async (academySlug, username, password) => {
    try {
      setLoading(true);
      
      const response = await studentAPI.login({
        academySlug,
        username,
        password,
      });

      if (response.token && response.student) {
        // Store token and student data
        setStudentToken(response.token);
        
        const studentData = {
          id: response.student.id,
          username: response.student.username,
          academyId: response.student.academyId,
          academySlug: academySlug,
          createdAt: response.student.createdAt,
        };
        
        setStudentData(studentData);
        setStudent(studentData);

        return { 
          success: true, 
          message: 'Login successful',
          student: studentData 
        };
      }

      return { 
        success: false, 
        message: 'Invalid response from server' 
      };
    } catch (error) {
      console.error('❌ Student login error:', error);
      return { 
        success: false, 
        message: error.message || 'Login failed. Please check your credentials.' 
      };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Student logout
   */
  const logout = () => {
    clearStudentData();
    setStudent(null);
  };

  /**
   * Get student performance data
   */
  const getPerformance = async () => {
    try {
      const response = await studentAPI.getPerformance();
      return { success: true, data: response };
    } catch (error) {
      console.error('❌ Get performance error:', error);
      return { 
        success: false, 
        message: error.message || 'Failed to fetch performance data' 
      };
    }
  };

  /**
   * Check if student is authenticated (computed on each render)
   */
  const isAuthenticated = !!student && !!getStudentToken();

  /**
   * Refresh student data from storage
   */
  const refreshStudentData = () => {
    const cachedStudent = getStudentData();
    if (cachedStudent) {
      setStudent(cachedStudent);
    }
  };

  const value = {
    // State
    student,
    loading,
    isAuthenticated,
    
    // Methods
    login,
    logout,
    getPerformance,
    refreshStudentData,
  };

  return (
    <StudentAuthContext.Provider value={value}>
      {children}
    </StudentAuthContext.Provider>
  );
};

/**
 * Custom hook to use student auth context
 */
export const useStudentAuth = () => {
  const context = useContext(StudentAuthContext);
  if (!context) {
    throw new Error('useStudentAuth must be used within StudentAuthProvider');
  }
  return context;
};

export default StudentAuthContext;
