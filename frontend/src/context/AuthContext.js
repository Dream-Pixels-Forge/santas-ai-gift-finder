import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getToken, getUser, setAuthData, clearAuthData, isAuthenticated } from '../utils/auth';
import { sanitizeInput, isValidEmail, validatePassword } from '../utils/security';

/**
 * Authentication Context
 */
const AuthContext = createContext();

/**
 * AuthProvider component that manages authentication state
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Initialize authentication state on mount
   */
  useEffect(() => {
    const initAuth = () => {
      try {
        if (isAuthenticated()) {
          const userData = getUser();
          setUser(userData);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        clearAuthData();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  /**
   * Login user with credentials
   * @param {string} username - Username
   * @param {string} password - Password
   * @returns {Promise<boolean>} Success status
   */
  const login = useCallback(async (username, password) => {
    setLoading(true);
    setError(null);

    // Sanitize inputs
    const sanitizedUsername = sanitizeInput(username);
    const sanitizedPassword = sanitizeInput(password);

    if (!sanitizedUsername || !sanitizedPassword) {
      setError('Please provide valid username and password');
      setLoading(false);
      return false;
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: sanitizedUsername,
          password: sanitizedPassword
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setAuthData(data.access_token, data.user);
        setUser(data.user);
        return true;
      } else {
        setError(data.error || 'Login failed');
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Network error. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Register new user
   * @param {string} username - Username
   * @param {string} email - Email
   * @param {string} password - Password
   * @returns {Promise<boolean>} Success status
   */
  const register = useCallback(async (username, email, password) => {
    setLoading(true);
    setError(null);

    // Sanitize and validate inputs
    const sanitizedUsername = sanitizeInput(username);
    const sanitizedEmail = sanitizeInput(email);
    const sanitizedPassword = sanitizeInput(password);

    if (!sanitizedUsername || !sanitizedEmail || !sanitizedPassword) {
      setError('Please provide valid username, email, and password');
      setLoading(false);
      return false;
    }

    if (!isValidEmail(sanitizedEmail)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return false;
    }

    const passwordValidation = validatePassword(sanitizedPassword);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.errors[0]);
      setLoading(false);
      return false;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: sanitizedUsername,
          email: sanitizedEmail,
          password: sanitizedPassword
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Auto-login after successful registration
        return await login(sanitizedUsername, sanitizedPassword);
      } else {
        setError(data.error || 'Registration failed');
        return false;
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('Network error. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  }, [login]);

  /**
   * Logout user
   */
  const logout = useCallback(() => {
    clearAuthData();
    setUser(null);
    setError(null);
  }, []);

  /**
   * Clear any authentication errors
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook to use authentication context
 * @returns {Object} Authentication context value
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};