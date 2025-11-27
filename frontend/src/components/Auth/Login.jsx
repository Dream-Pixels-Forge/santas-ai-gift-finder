import React, { useState, useCallback } from 'react';
import { FaUser, FaLock, FaSnowflake } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import PropTypes from 'prop-types';

/**
 * Login component for user authentication
 * @param {Object} props - Component props
 * @param {Function} props.onSwitchToRegister - Callback to switch to register form
 */
const Login = ({ onSwitchToRegister }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, error, clearError } = useAuth();

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
   * Handle form submission
   * @param {Event} e - Form submit event
   */
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    if (!formData.username.trim() || !formData.password.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await login(formData.username.trim(), formData.password);
      if (!success) {
        // Error is handled by context
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, login]);

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <FaSnowflake className="auth-icon" />
          <h2>Welcome Back!</h2>
          <p>Sign in to find the perfect gifts</p>
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
                placeholder="Username"
                required
                disabled={isSubmitting}
                aria-label="Username"
                autoComplete="username"
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
                placeholder="Password"
                required
                disabled={isSubmitting}
                aria-label="Password"
                autoComplete="current-password"
              />
            </div>
          </div>

          {error && (
            <div className="auth-error" role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="auth-button"
            disabled={isSubmitting || !formData.username.trim() || !formData.password.trim()}
          >
            {isSubmitting ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account?{' '}
            <button
              type="button"
              className="auth-link"
              onClick={onSwitchToRegister}
              disabled={isSubmitting}
            >
              Sign Up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

Login.propTypes = {
  onSwitchToRegister: PropTypes.func.isRequired,
};

export default Login;