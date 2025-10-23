import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../lib/api';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'teacher' | 'student';
  roll_number?: string;
  department?: {
    id: number;
    name: string;
    code: string;
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; password: string; department_id?: number; roll_number?: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user from backend (cookie-based) on mount
  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      // Try to get user from backend using cookie
      const response = await authAPI.getMe();
      setUser(response.data.user);
    } catch (error) {
      // No valid session, user needs to login
      // This is normal behavior when user is not logged in
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login({ email, password });
      const { user: newUser } = response.data;
      setUser(newUser);
    } catch (error: any) {
      throw error;
    }
  };

  const register = async (data: { name: string; email: string; password: string; department_id?: number; roll_number?: string }) => {
    try {
      const response = await authAPI.register(data);
      const { user: newUser } = response.data;

      setUser(newUser);
    } catch (error: any) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Call backend logout to clear cookie
      await authAPI.logout();
    } catch (error) {
      // Silently handle API errors, still logout locally
      // Error will be handled by the calling component
    } finally {
      // Always clear user state
      setUser(null);
    }
  };

  const refreshUser = async () => {
    try {
      const response = await authAPI.getMe();
      setUser(response.data.user);
    } catch (error) {
      // Session expired or invalid, clear user
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refreshUser,
        isAuthenticated: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
