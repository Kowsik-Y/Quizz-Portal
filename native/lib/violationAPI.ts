import { API_URL } from './api';

// Violation API service
export const violationAPI = {
  // Record a single violation
  recordViolation: async (violationData: {
    attempt_id: number;
    test_id: number;
    violation_type: 'window_switch' | 'screenshot_attempt' | 'phone_call' | 'tab_switch' | 'copy_paste' | 'other';
    details?: any;
    severity?: 'low' | 'medium' | 'high' | 'critical';
  }) => {
    try {
      const response = await fetch(`${API_URL}/violations/record`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(violationData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to record violation');
      }

      return await response.json();
    } catch (error) {
      console.error('Record violation error:', error);
      throw error;
    }
  },

  // Record multiple violations at once
  recordBulkViolations: async (violations: Array<{
    attempt_id: number;
    test_id: number;
    violation_type: string;
    details?: any;
    severity?: string;
  }>) => {
    try {
      const response = await fetch(`${API_URL}/violations/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ violations }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to record violations');
      }

      return await response.json();
    } catch (error) {
      console.error('Bulk record violations error:', error);
      throw error;
    }
  },

  // Get violations for a specific attempt
  getAttemptViolations: async (attemptId: number) => {
    try {
      const response = await fetch(`${API_URL}/violations/attempt/${attemptId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch attempt violations');
      }

      return await response.json();
    } catch (error) {
      console.error('Get attempt violations error:', error);
      throw error;
    }
  },

  // Get all violations for a test
  getTestViolations: async (testId: number) => {
    try {
      const response = await fetch(`${API_URL}/violations/test/${testId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch test violations');
      }

      return await response.json();
    } catch (error) {
      console.error('Get test violations error:', error);
      throw error;
    }
  },

  // Get violations for a specific user
  getUserViolations: async (userId: number) => {
    try {
      const response = await fetch(`${API_URL}/violations/user/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch user violations');
      }

      return await response.json();
    } catch (error) {
      console.error('Get user violations error:', error);
      throw error;
    }
  },
};

export default violationAPI;
