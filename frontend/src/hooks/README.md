# Custom Hooks Documentation

## Overview

This directory contains custom React hooks that encapsulate reusable logic for the Santa's AI Gift Finder application. Hooks follow established patterns for API communication, state management, and side effects.

## Hook Architecture

### Design Principles
- **Single Responsibility**: Each hook handles one specific concern
- **Reusability**: Hooks can be used across multiple components
- **Testability**: Isolated logic easy to unit test
- **Performance**: Optimized with proper dependency management
- **Type Safety**: Comprehensive error handling and validation

### File Structure
```
hooks/
├── useHookName.js        # Main hook file
└── useHookName.test.js   # Unit tests
```

## Available Hooks

### useApi Hook

**File**: `useApi.js`
**Purpose**: Centralized API communication layer

#### Return Value
```javascript
const { loading, error, request } = useApi();

// loading: boolean - Current request state
// error: string|null - Error message if request failed
// request: function - API request function
```

#### API Request Function
```javascript
const request = async (endpoint, options = {}) => {
  // endpoint: string - API endpoint (relative or absolute URL)
  // options: object - Axios request configuration
  // Returns: Promise with response data
};
```

#### Features
- Environment-based URL configuration
- Automatic loading state management
- Centralized error handling and parsing
- Request/response logging (development)
- Timeout and retry logic (future enhancement)

#### Usage Examples
```javascript
import { useApi } from '../hooks/useApi';

const MyComponent = () => {
  const { loading, error, request } = useApi();

  const handleSearch = async (query) => {
    try {
      const data = await request('/search', {
        method: 'POST',
        data: { query }
      });
      // Handle success
      setResults(data.recommendations);
    } catch (err) {
      // Handle error (already set in hook)
      console.error('Search failed:', err);
    }
  };

  return (
    <div>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      {/* Component JSX */}
    </div>
  );
};
```

#### Error Handling
The hook automatically handles different error types:

- **Network Errors**: Connection failures, timeouts
- **HTTP Errors**: 4xx/5xx status codes with custom messages
- **Validation Errors**: API response validation failures
- **Timeout Errors**: Request timeouts (configurable)

#### Environment Configuration
```javascript
// Development
REACT_APP_API_URL=http://localhost:5000/api

// Production
REACT_APP_API_URL=https://santas-ai-gift-finder-backend.onrender.com/api
```

## Hook Patterns

### Custom Hook Creation Guidelines

#### Naming Convention
```javascript
// Good: Descriptive and prefixed with 'use'
const useApi = () => { /* ... */ };
const useLocalStorage = () => { /* ... */ };

// Avoid: Non-descriptive or missing 'use' prefix
const apiHook = () => { /* ... */ };
const dataFetcher = () => { /* ... */ };
```

#### Dependency Management
```javascript
const useCustomHook = (dependencies) => {
  // Use useCallback for functions returned by hooks
  const callback = useCallback(() => {
    // Callback logic
  }, [dependencies]); // Include all dependencies

  // Use useMemo for expensive computations
  const computedValue = useMemo(() => {
    return expensiveComputation(dependencies);
  }, [dependencies]);

  return { callback, computedValue };
};
```

#### Error Boundaries Integration
```javascript
const useAsyncOperation = () => {
  const [error, setError] = useState(null);

  const performOperation = useCallback(async () => {
    try {
      setError(null);
      // Async operation
    } catch (err) {
      setError(err.message);
      // Could also throw to trigger error boundary
      throw err;
    }
  }, []);

  return { error, performOperation };
};
```

## Testing Strategy

### Hook Testing with renderHook
```javascript
import { renderHook, act, waitFor } from '@testing-library/react';

describe('useApi Hook', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('returns initial state', () => {
    const { result } = renderHook(() => useApi());

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(typeof result.current.request).toBe('function');
  });

  it('handles successful requests', async () => {
    const { result } = renderHook(() => useApi());

    await act(async () => {
      await result.current.request('/search', {
        method: 'POST',
        data: { query: 'test' }
      });
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });
});
```

### Mock Service Worker Integration
```javascript
// Test with MSW for API mocking
import { server } from '../../mocks/server';

describe('API Integration', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  // Tests that make real API calls (but mocked)
});
```

## Performance Considerations

### Hook Optimization
- **Dependency Arrays**: Include all dependencies to prevent stale closures
- **Memoization**: Use `useMemo` for expensive computations
- **Callback Stability**: Use `useCallback` for functions passed to dependencies

### Memory Management
```javascript
const useDataFetcher = (url) => {
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      const data = await fetch(url);
      if (isMounted) {
        setData(data);
      }
    };

    fetchData();

    return () => {
      isMounted = false; // Cleanup to prevent state updates on unmounted component
    };
  }, [url]);
};
```

## Future Enhancements

### Planned Hook Improvements
- **useDebounce**: Input debouncing for search
- **useLocalStorage**: Persistent state management
- **useIntersectionObserver**: Infinite scroll and lazy loading
- **useMediaQuery**: Responsive design hooks
- **usePrevious**: Access to previous prop/state values

### Advanced Features
- **Error Recovery**: Automatic retry with exponential backoff
- **Caching**: Response caching with invalidation
- **Offline Support**: Service worker integration
- **Real-time Updates**: WebSocket integration

## Development Guidelines

### Creating New Hooks
1. Identify reusable logic across components
2. Create hook file with comprehensive JSDoc
3. Implement proper error handling
4. Write unit tests with high coverage
5. Add TypeScript types (future migration)
6. Update this documentation

### Hook Composition
```javascript
// Compose multiple hooks
const useSearch = () => {
  const { loading, error, request } = useApi();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const search = useCallback(async () => {
    const data = await request('/search', {
      method: 'POST',
      data: { query }
    });
    setResults(data.recommendations);
  }, [query, request]);

  return { query, setQuery, results, loading, error, search };
};
```

### Code Standards
- Use functional programming principles
- Prefer immutable data patterns
- Handle all edge cases and error conditions
- Document complex logic with comments
- Follow React hooks rules strictly

## Maintenance

### Regular Tasks
- Update hook dependencies quarterly
- Review performance and optimize if needed
- Add new hooks for common patterns
- Maintain test coverage above 80%

### Deprecation Strategy
- Mark deprecated hooks with console warnings
- Provide migration paths to new implementations
- Maintain backward compatibility during transitions

### Monitoring
- Track hook usage and performance
- Monitor error rates from API hooks
- Analyze bundle size impact of new hooks

This documentation ensures consistent development and maintenance of custom React hooks across the Santa's AI Gift Finder application.