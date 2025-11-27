import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import Login from '../../../components/Auth/Login';
import { AuthProvider } from '../../../context/AuthContext';

expect.extend(toHaveNoViolations);

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

const renderLogin = (props = {}) => {
  return render(
    <AuthProvider>
      <Login onSwitchToRegister={jest.fn()} {...props} />
    </AuthProvider>
  );
};

describe('Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetch.mockClear();
  });

  describe('Rendering', () => {
    it('renders login form correctly', () => {
      renderLogin();

      expect(screen.getByText('Welcome Back!')).toBeInTheDocument();
      expect(screen.getByText('Sign in to find the perfect gifts')).toBeInTheDocument();
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
      expect(screen.getByText('Sign Up')).toBeInTheDocument();
    });

    it('renders all form elements with correct attributes', () => {
      renderLogin();

      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      expect(usernameInput).toHaveAttribute('type', 'text');
      expect(usernameInput).toHaveAttribute('required');
      expect(usernameInput).toHaveAttribute('autoComplete', 'username');

      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(passwordInput).toHaveAttribute('required');
      expect(passwordInput).toHaveAttribute('autoComplete', 'current-password');

      expect(submitButton).toHaveAttribute('type', 'submit');
    });
  });

  describe('Form Validation', () => {
    it('shows error when submitting empty form', async () => {
      const user = userEvent.setup();
      renderLogin();

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Please provide valid username and password')).toBeInTheDocument();
      });
    });

    it('shows error when submitting with only username', async () => {
      const user = userEvent.setup();
      renderLogin();

      const usernameInput = screen.getByLabelText(/username/i);
      await user.type(usernameInput, 'testuser');

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Please provide valid username and password')).toBeInTheDocument();
      });
    });

    it('shows error when submitting with only password', async () => {
      const user = userEvent.setup();
      renderLogin();

      const passwordInput = screen.getByLabelText(/password/i);
      await user.type(passwordInput, 'password123');

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Please provide valid username and password')).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('submits form with valid credentials', async () => {
      const user = userEvent.setup();
      const mockResponse = {
        success: true,
        access_token: 'mock-token',
        user: { id: 1, username: 'testuser', email: 'test@example.com' }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      renderLogin();

      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(usernameInput, 'testuser');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: 'testuser',
            password: 'password123'
          })
        });
      });
    });

    it('shows loading state during submission', async () => {
      const user = userEvent.setup();

      fetch.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      renderLogin();

      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(usernameInput, 'testuser');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      expect(screen.getByRole('button', { name: /signing in/i })).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
      expect(usernameInput).toBeDisabled();
      expect(passwordInput).toBeDisabled();
    });

    it('shows error message on login failure', async () => {
      const user = userEvent.setup();
      const mockResponse = {
        success: false,
        error: 'Invalid username or password'
      };

      fetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve(mockResponse)
      });

      renderLogin();

      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(usernameInput, 'testuser');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid username or password')).toBeInTheDocument();
      });
    });

    it('handles network errors', async () => {
      const user = userEvent.setup();

      fetch.mockRejectedValueOnce(new Error('Network error'));

      renderLogin();

      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(usernameInput, 'testuser');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Network error. Please try again.')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('calls onSwitchToRegister when Sign Up link is clicked', async () => {
      const user = userEvent.setup();
      const mockOnSwitch = jest.fn();
      renderLogin({ onSwitchToRegister: mockOnSwitch });

      const signUpLink = screen.getByText('Sign Up');
      await user.click(signUpLink);

      expect(mockOnSwitch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = renderLogin();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      renderLogin();

      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.tab();
      expect(usernameInput).toHaveFocus();

      await user.tab();
      expect(passwordInput).toHaveFocus();

      await user.tab();
      expect(submitButton).toHaveFocus();
    });

    it('has correct form structure', () => {
      renderLogin();

      const form = screen.getByRole('form', { name: /gift search form/i });
      expect(form).toBeInTheDocument();

      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/password/i);

      expect(usernameInput).toHaveAttribute('aria-required', 'true');
      expect(passwordInput).toHaveAttribute('aria-required', 'true');
    });
  });

  describe('Input Sanitization', () => {
    it('sanitizes username input', async () => {
      const user = userEvent.setup();
      const mockResponse = {
        success: true,
        access_token: 'mock-token',
        user: { id: 1, username: 'testuser', email: 'test@example.com' }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      renderLogin();

      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // Type potentially dangerous input
      await user.type(usernameInput, 'test<user>');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/auth/login', expect.objectContaining({
          body: JSON.stringify({
            username: 'testuser', // Angle brackets should be removed
            password: 'password123'
          })
        }));
      });
    });
  });
});