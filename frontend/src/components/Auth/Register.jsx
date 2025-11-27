import React, { useState, useCallback } from 'react';
import { FaUser, FaEnvelope, FaLock, FaSnowflake } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import PropTypes from 'prop-types';

/**
 * Register component for user registration
 * @param {Object} props - Component props
 * @param {Function} props.onSwitchToLogin - Callback to switch to login form
 */
const Register = ({ onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, error, clearError } = useAuth();

  /**
   * Handle input changes
   * @param {Event} e - Input change event
   */
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (error) clearError();
  }, [error, clearError]);

  /**
   * Validate form data
   * @returns {string|null} Error message or null if valid
   */
  const validateForm = useCallback(() => {
    if (!formData.username.trim()) return 'Username is required';
    if (formData.username.length < 3) return 'Username must be at least 3 characters';
    if (!formData.email.trim()) return 'Email is required';
    if (!/\S+@\S+\.\S+/.test(formData.email)) return 'Please enter a valid email';
    if (!formData.password) return 'Password is required';
    if (formData.password.length < 8) return 'Password must be at least 8 characters';
    if (formData.password !== formData.confirmPassword) return 'Passwords do not match';

    return null;
  }, [formData]);

  /**
   * Handle form submission
   * @param {Event} e - Form submit event
   */
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await register(
        formData.username.trim(),
        formData.email.trim(),
        formData.password
      );
      if (!success) {
        // Error is handled by context
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, register, validateForm]);

  const validationError = validateForm();
  const isFormValid = !validationError && formData.username && formData.email && formData.password && formData.confirmPassword;

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <FaSnowflake className="auth-icon" />
          <h2>Join Santa's Team!</h2>
          <p>Create your account to start finding perfect gifts</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="username" className="sr-only">Username</label>
            <div className="input-wrapper">
              <FaUser className="input-icon" />
              <input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Username (min 3 characters)"
                required
                disabled={isSubmitting}
                aria-label="Username"
                autoComplete="username"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email" className="sr-only">Email</label>
            <div className="input-wrapper">
              <FaEnvelope className="input-icon" />
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Email address"
                required
                disabled={isSubmitting}
                aria-label="Email"
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password" className="sr-only">Password</label>
            <div className="input-wrapper">
              <FaLock className="input-icon" />
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Password (min 8 characters)"
                required
                disabled={isSubmitting}
                aria-label="Password"
                autoComplete="new-password"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="sr-only">Confirm Password</label>
            <div className="input-wrapper">
              <FaLock className="input-icon" />
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirm password"
                required
                disabled={isSubmitting}
                aria-label="Confirm Password"
                autoComplete="new-password"
              />
            </div>
          </div>

          {error && (
            <div className="auth-error" role="alert">
              {error}
            </div>
          )}

          {!error && validationError && (
            <div className="auth-error" role="alert">
              {validationError}
            </div>
          )}

          <button
            type="submit"
            className="auth-button"
            disabled={isSubmitting || !isFormValid}
          >
            {isSubmitting ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <button
              type="button"
              className="auth-link"
              onClick={onSwitchToLogin}
              disabled={isSubmitting}
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

Register.propTypes = {
  onSwitchToLogin: PropTypes.func.isRequired,
};

export default Register;