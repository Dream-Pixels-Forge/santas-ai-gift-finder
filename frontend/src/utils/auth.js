/**
 * Authentication utilities for JWT token management
 */

// Token storage keys
const TOKEN_KEY = 'santa_auth_token';
const USER_KEY = 'santa_user_data';

/**
 * Store authentication token and user data
 * @param {string} token - JWT token
 * @param {Object} user - User data
 */
export const setAuthData = (token, user) => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('Failed to store auth data:', error);
  }
};

/**
 * Get stored authentication token
 * @returns {string|null} JWT token or null if not found
 */
export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error('Failed to get token:', error);
    return null;
  }
};

/**
 * Get stored user data
 * @returns {Object|null} User data or null if not found
 */
export const getUser = () => {
  try {
    const userData = localStorage.getItem(USER_KEY);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Failed to get user data:', error);
    return null;
  }
};

/**
 * Check if user is authenticated
 * @returns {boolean} True if token exists and is valid
 */
export const isAuthenticated = () => {
  const token = getToken();
  if (!token) return false;

  try {
    // Basic JWT validation - check if not expired
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp > currentTime;
  } catch (error) {
    console.error('Token validation error:', error);
    return false;
  }
};

/**
 * Clear authentication data
 */
export const clearAuthData = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch (error) {
    console.error('Failed to clear auth data:', error);
  }
};

/**
 * Get authorization header for API requests
 * @returns {Object} Headers object with Authorization header
 */
export const getAuthHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Refresh token if needed (placeholder for future implementation)
 * @returns {Promise<boolean>} True if token was refreshed successfully
 */
export const refreshToken = async () => {
  // TODO: Implement token refresh logic
  return false;
};