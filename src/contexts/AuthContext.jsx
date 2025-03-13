/**
 * @fileoverview Authentication Context Provider
 * Manages authentication state and operations throughout the application.
 * 
 * Features:
 * - JWT-based authentication
 * - Secure token storage
 * - Automatic token refresh
 * - Session management
 * 
 * @module AuthContext
 */

import { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/ui/use-toast';
import { ApiError } from '../lib/errors';

const AuthContext = createContext();

/**
 * Hook to access authentication context
 * @returns {Object} Authentication context value
 * @throws {Error} If used outside AuthProvider
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Authentication Provider Component
 * @component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Token refresh interval (15 minutes)
  const REFRESH_INTERVAL = 15 * 60 * 1000;

  /**
   * Verifies the current authentication token
   * @private
   * @async
   * @returns {Promise<boolean>} True if token is valid
   */
  const verifyToken = async () => {
    try {
      const response = await fetch('/api/admin/verify', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new ApiError('Token verification failed', response.status);
      }
      
      const data = await response.json();
      setUser(data.user);
      return true;
    } catch (error) {
      console.error('Token verification failed:', error);
      return false;
    }
  };

  /**
   * Refreshes the authentication token
   * @private
   * @async
   */
  const refreshToken = async () => {
    try {
      const response = await fetch('/api/admin/refresh', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new ApiError('Token refresh failed', response.status);
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      handleLogout();
    }
  };

  // Set up token refresh interval
  useEffect(() => {
    let refreshInterval;
    
    if (isAuthenticated) {
      refreshInterval = setInterval(refreshToken, REFRESH_INTERVAL);
    }
    
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [isAuthenticated]);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        const isValid = await verifyToken();
        setIsAuthenticated(isValid);
      } catch (error) {
        console.error('Auth check error:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  /**
   * Handles user login
   * @async
   * @param {string} username - Username
   * @param {string} password - Password
   * @returns {Promise<Object>} Login result
   */
  const login = async (username, password) => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new ApiError(data.message || 'Login failed', response.status);
      }
      
      const data = await response.json();
      setUser(data.user);
      setIsAuthenticated(true);
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        message: error.message || 'Login failed. Please check your credentials.' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles user logout
   * @async
   */
  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      navigate('/admin/login');
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
    }
  };

  const value = {
    isAuthenticated,
    isLoading,
    user,
    login,
    logout: handleLogout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
