import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('🔍 [AuthContext] AuthProvider mounted, checking token...');
    const token = localStorage.getItem('auth_token');
    console.log('🔍 [AuthContext] Token from localStorage:', token ? 'Present' : 'Missing');
    
    if (token) {
      console.log('🔍 [AuthContext] Verifying token with server...');
      authService.verifyToken(token)
        .then(response => {
          console.log('🔍 [AuthContext] Token verification response:', response);
          if (response.success) {
            console.log('🔍 [AuthContext] Token valid, setting user:', response.user);
            setUser(response.user);
          } else {
            console.log('🔍 [AuthContext] Token invalid, removing from localStorage');
            localStorage.removeItem('auth_token');
          }
        })
        .catch(() => {
          console.log('🔍 [AuthContext] Token verification failed, removing from localStorage');
          localStorage.removeItem('auth_token');
        })
        .finally(() => {
          console.log('🔍 [AuthContext] Token verification complete, setting isLoading to false');
          setIsLoading(false);
        });
    } else {
      console.log('🔍 [AuthContext] No token found, setting isLoading to false');
      setIsLoading(false);
    }
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      console.log('🔍 [AuthContext] Login attempt for username:', username);
      const response = await authService.login(username, password);
      console.log('🔍 [AuthContext] Login response:', response);
      if (response.success && response.token) {
        console.log('🔍 [AuthContext] Login successful, storing token and setting user');
        localStorage.setItem('auth_token', response.token);
        setUser(response.user);
        return true;
      }
      console.log('🔍 [AuthContext] Login failed');
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    console.log('🔍 [AuthContext] Logout called');
    localStorage.removeItem('auth_token');
    setUser(null);
  };

  const value = {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};