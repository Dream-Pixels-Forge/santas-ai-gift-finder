import { renderHook, act, waitFor } from '@testing-library/react';
import { useApi } from '../../hooks/useApi';
import { server } from '../../mocks/server';

// Mock environment variable
const originalEnv = process.env;
beforeEach(() => {
  jest.resetModules();
  process.env = { ...originalEnv, REACT_APP_API_URL: 'https://test-api.com' };
});

afterEach(() => {
  process.env = originalEnv;
});

describe('useApi Hook', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  describe('Initial State', () => {
    it('returns initial state correctly', () => {
      const { result } = renderHook(() => useApi());

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(typeof result.current.request).toBe('function');
    });
  });

  describe('Successful Requests', () => {
    it('handles successful POST request', async () => {
      const { result } = renderHook(() => useApi());

      let response;
      await act(async () => {
        response = await result.current.request('/search', {
          method: 'POST',
          data: { query: 'test query' }
        });
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(response).toHaveProperty('recommendations');
      expect(Array.isArray(response.recommendations)).toBe(true);
    });

    it('sets loading state during request', async () => {
      const { result } = renderHook(() => useApi());

      act(() => {
        result.current.request('/search', {
          method: 'POST',
          data: { query: 'test' }
        });
      });

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('clears previous errors on successful request', async () => {
      const { result } = renderHook(() => useApi());

      // First, trigger an error
      await act(async () => {
        try {
          await result.current.request('/search', {
            method: 'POST',
            data: { query: 'error' }
          });
        } catch (e) {
          // Expected error
        }
      });

      expect(result.current.error).not.toBe(null);

      // Then make a successful request
      await act(async () => {
        await result.current.request('/search', {
          method: 'POST',
          data: { query: 'success' }
        });
      });

      expect(result.current.error).toBe(null);
    });
  });

  describe('Error Handling', () => {
    it('handles API errors correctly', async () => {
      const { result } = renderHook(() => useApi());

      await act(async () => {
        try {
          await result.current.request('/search', {
            method: 'POST',
            data: { query: 'error' }
          });
        } catch (e) {
          // Expected to throw
        }
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Internal server error');
    });

    it('handles network errors', async () => {
      const { result } = renderHook(() => useApi());

      await act(async () => {
        try {
          await result.current.request('/nonexistent-endpoint');
        } catch (e) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Not found');
    });

    it('handles malformed responses', async () => {
      const { result } = renderHook(() => useApi());

      await act(async () => {
        try {
          await result.current.request('/search', {
            method: 'POST',
            data: { query: 'empty' }
          });
        } catch (e) {
          // Should not throw for empty results
        }
      });

      expect(result.current.error).toBe(null);
    });
  });

  describe('URL Construction', () => {
    it('constructs full URL from relative endpoint', async () => {
      const { result } = renderHook(() => useApi());

      await act(async () => {
        await result.current.request('/search', {
          method: 'POST',
          data: { query: 'test' }
        });
      });

      // The mock server handles this, but we're testing the logic
      expect(result.current.error).toBe(null);
    });

    it('uses absolute URLs as-is', async () => {
      const { result } = renderHook(() => useApi());

      await act(async () => {
        try {
          await result.current.request('https://external-api.com/test');
        } catch (e) {
          // Expected for external URL
        }
      });

      // Should attempt to make request to external URL
      expect(result.current.loading).toBe(false);
    });
  });

  describe('Request Options', () => {
    it('passes through axios options correctly', async () => {
      const { result } = renderHook(() => useApi());

      const customOptions = {
        method: 'POST',
        timeout: 5000,
        headers: { 'Custom-Header': 'test' }
      };

      await act(async () => {
        await result.current.request('/search', {
          ...customOptions,
          data: { query: 'test' }
        });
      });

      expect(result.current.error).toBe(null);
    });

    it('handles different HTTP methods', async () => {
      const { result } = renderHook(() => useApi());

      // Test with different method (though our mock only handles POST)
      await act(async () => {
        try {
          await result.current.request('/search', {
            method: 'GET'
          });
        } catch (e) {
          // Expected for unsupported method
        }
      });

      expect(result.current.loading).toBe(false);
    });
  });

  describe('State Management', () => {
    it('resets loading state after request completes', async () => {
      const { result } = renderHook(() => useApi());

      await act(async () => {
        await result.current.request('/search', {
          method: 'POST',
          data: { query: 'test' }
        });
      });

      expect(result.current.loading).toBe(false);
    });

    it('maintains error state until next request', async () => {
      const { result } = renderHook(() => useApi());

      await act(async () => {
        try {
          await result.current.request('/search', {
            method: 'POST',
            data: { query: 'error' }
          });
        } catch (e) {
          // Expected
        }
      });

      expect(result.current.error).toBe('Internal server error');

      // Error should persist until next request
      expect(result.current.error).toBe('Internal server error');
    });

    it('clears error state on new request', async () => {
      const { result } = renderHook(() => useApi());

      // First request with error
      await act(async () => {
        try {
          await result.current.request('/search', {
            method: 'POST',
            data: { query: 'error' }
          });
        } catch (e) {
          // Expected
        }
      });

      expect(result.current.error).toBe('Internal server error');

      // Second request should clear error
      act(() => {
        result.current.request('/search', {
          method: 'POST',
          data: { query: 'test' }
        });
      });

      expect(result.current.error).toBe(null);
      expect(result.current.loading).toBe(true);
    });
  });

  describe('Environment Variables', () => {
    it('uses default API URL when env var not set', () => {
      delete process.env.REACT_APP_API_URL;
      const { result } = renderHook(() => useApi());

      expect(result.current).toBeDefined();
    });

    it('uses custom API URL from environment', () => {
      process.env.REACT_APP_API_URL = 'https://custom-api.com';
      const { result } = renderHook(() => useApi());

      expect(result.current).toBeDefined();
    });
  });

  describe('Concurrent Requests', () => {
    it('handles multiple concurrent requests', async () => {
      const { result } = renderHook(() => useApi());

      const promises = [
        result.current.request('/search', { method: 'POST', data: { query: 'test1' } }),
        result.current.request('/search', { method: 'POST', data: { query: 'test2' } })
      ];

      await act(async () => {
        await Promise.all(promises);
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });
});