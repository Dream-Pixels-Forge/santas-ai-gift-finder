/**
 * Security utilities for input sanitization and validation
 */

/**
 * Sanitizes user input by removing potentially dangerous characters
 * @param {string} input - Input string to sanitize
 * @returns {string} Sanitized string
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;

  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .trim();
};

/**
 * Validates email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email format
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates password strength
 * @param {string} password - Password to validate
 * @returns {Object} Validation result with isValid and errors array
 */
export const validatePassword = (password) => {
  const errors = [];

  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Sanitizes and validates search query
 * @param {string} query - Search query to process
 * @returns {Object} Processed query with validation
 */
export const processSearchQuery = (query) => {
  const sanitized = sanitizeInput(query);

  return {
    query: sanitized,
    isValid: sanitized.length >= 2,
    error: sanitized.length < 2 ? 'Search query must be at least 2 characters long' : null
  };
};

/**
 * Creates CSRF token (placeholder for future implementation)
 * @returns {string} CSRF token
 */
export const generateCSRFToken = () => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

/**
 * Validates CSRF token (placeholder for future implementation)
 * @param {string} token - Token to validate
 * @returns {boolean} True if valid
 */
export const validateCSRFToken = (token) => {
  // TODO: Implement proper CSRF validation
  return true;
};