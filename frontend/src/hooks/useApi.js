import { useState, useCallback } from 'react';
import axios from 'axios';
import { getAuthHeaders } from '../utils/auth';
import { trackApiCall } from '../utils/monitoring';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://santas-ai-gift-finder-backend.onrender.com/api';

/**
 * Custom hook for making API requests with loading and error states
 * @returns {Object} Object containing loading state, error state, and request function
 * @returns {boolean} loading - Loading state of the request
 * @returns {string|null} error - Error message if request failed
 * @returns {Function} request - Function to make API requests
 */
export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Makes an API request to the specified endpoint
   * @param {string} endpoint - API endpoint (can be relative or absolute URL)
   * @param {Object} options - Axios request options
   * @returns {Promise<Object>} Promise resolving to response data
   * @throws {Error} Throws error if request fails
   */
  const request = useCallback(async (endpoint, options = {}) => {
    const startTime = performance.now();
    setLoading(true);
    setError(null);

    try {
      const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

      // Merge auth headers with provided headers
      const headers = {
        ...getAuthHeaders(),
        ...options.headers,
      };

      const res = await axios({
        url,
        ...options,
        headers,
      });

      // Track successful API call
      const duration = performance.now() - startTime;
      trackApiCall(endpoint, duration, true);

      return res.data;
    } catch (err) {
      // Track failed API call
      const duration = performance.now() - startTime;
      trackApiCall(endpoint, duration, false);

      const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || 'An error occurred';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, request };
};