# Implementation Guide

## Code Patterns and Technical Implementation Details

This guide documents the implementation patterns, code standards, and technical details used in the Santa's AI Gift Finder frontend application.

## Component Implementation Patterns

### React.memo Usage Pattern

All major components use React.memo for performance optimization:

```javascript
const ComponentName = memo(({ prop1, prop2 }) => {
  // Component logic
  return <div>{/* JSX */}</div>;
});

ComponentName.displayName = 'ComponentName';
```

**When to use React.memo:**
- Components that re-render frequently with same props
- Pure functional components
- Components in lists or grids

**Code Reference**: [`frontend/src/App.jsx:12`](frontend/src/App.jsx:12)

### useCallback for Event Handlers

Stable function references prevent unnecessary re-renders:

```javascript
const handleEvent = useCallback((event) => {
  // Event handling logic
}, [dependencies]);
```

**Best Practices:**
- Include all dependencies in the dependency array
- Use for event handlers passed to child components
- Avoid overuse - only for performance-critical paths

**Code Reference**: [`frontend/src/App.jsx:22-26`](frontend/src/App.jsx:22-26)

### PropTypes for Type Checking

Comprehensive prop validation for all components:

```javascript
ComponentName.propTypes = {
  requiredProp: PropTypes.string.isRequired,
  optionalProp: PropTypes.arrayOf(PropTypes.object),
  complexProp: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string
  })
};
```

**Validation Rules:**
- Use `.isRequired` for mandatory props
- Define complex object shapes with `PropTypes.shape`
- Use `PropTypes.arrayOf` for arrays

**Code Reference**: [`frontend/src/GiftCard.jsx:63-74`](frontend/src/GiftCard.jsx:63-74)

## State Management Patterns

### Local State with useState

Component-level state management pattern:

```javascript
const [state, setState] = useState(initialValue);

// For complex state updates
setState(prevState => ({ ...prevState, updatedField: newValue }));
```

**State Organization:**
- Group related state in objects
- Use functional updates for state based on previous state
- Initialize state with proper default values

**Code Reference**: [`frontend/src/App.jsx:13-16`](frontend/src/App.jsx:13-16)

### State Lifting Pattern

Shared state lifted to common parent:

```javascript
// Parent component
const [sharedState, setSharedState] = useState(initial);

// Pass to children
<ChildComponent state={sharedState} onUpdate={setSharedState} />
```

**When to use:**
- State needed by multiple sibling components
- State coordination between components
- Form state management

## API Integration Patterns

### Custom Hook for API Calls

Centralized API communication with useApi hook:

```javascript
const { loading, error, request } = useApi();

const fetchData = async () => {
  try {
    const data = await request('/endpoint', {
      method: 'POST',
      data: payload
    });
    // Handle success
  } catch (err) {
    // Handle error
  }
};
```

**Features:**
- Automatic loading state management
- Centralized error handling
- Environment-based URL configuration

**Code Reference**: [`frontend/src/hooks/useApi.js`](frontend/src/hooks/useApi.js)

### Error Handling Strategy

User-friendly error handling with fallbacks:

```javascript
try {
  const data = await request('/api/endpoint');
  if (!data?.results) {
    setError('No results found');
    return;
  }
  setResults(data.results);
} catch (err) {
  setError('Failed to load data. Please try again.');
}
```

**Error Handling Best Practices:**
- Provide user-friendly error messages
- Handle both API errors and network failures
- Clear errors on successful operations

## Styling Implementation

### CSS Variables Pattern

Design tokens using CSS custom properties:

```css
:root {
  --color-primary: #ff4757;
  --spacing-md: 1rem;
  --shadow-card: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.component {
  color: var(--color-primary);
  padding: var(--spacing-md);
  box-shadow: var(--shadow-card);
}
```

**Fallback Pattern:**
```css
color: #ff4757; /* Fallback */
color: var(--color-primary); /* CSS Variable */
```

**Code Reference**: [`frontend/src/styles/variables.css`](frontend/src/styles/variables.css)

### Component-Scoped Styling

Modular CSS approach:

```css
/* components/ComponentName.css */
.component-name {
  /* Component-specific styles */
}

.component-name__element {
  /* Element-specific styles */
}

.component-name--modifier {
  /* Modifier styles */
}
```

**BEM-like Naming Convention:**
- `.component-name` - Block
- `.component-name__element` - Element
- `.component-name--modifier` - Modifier

**Code Reference**: [`frontend/src/styles/components/GiftCard.css`](frontend/src/styles/components/GiftCard.css)

## Accessibility Implementation

### ARIA Attributes Pattern

Comprehensive ARIA implementation:

```javascript
// Form with proper labeling
<form role="search" aria-label="Gift search form">
  <label htmlFor="search-input" className="sr-only">
    Search for gifts
  </label>
  <input
    id="search-input"
    aria-required="true"
    aria-describedby={error ? "search-error" : undefined}
  />
  {error && <div id="search-error" role="alert">{error}</div>}
</form>
```

**ARIA Best Practices:**
- Use semantic HTML when possible
- Provide labels and descriptions
- Use live regions for dynamic content
- Test with screen readers

**Code Reference**: [`frontend/src/components/SearchForm.jsx:50-82`](frontend/src/components/SearchForm.jsx:50-82)

### Focus Management

Keyboard navigation support:

```javascript
// Focus-visible polyfill integration
import './utils/focus-visible-polyfill';

// Component with focus management
<button
  className="focus-visible"
  onClick={handleClick}
>
  Click me
</button>
```

**Focus Management Rules:**
- Ensure all interactive elements are keyboard accessible
- Provide visible focus indicators
- Manage focus programmatically when needed

**Code Reference**: [`frontend/src/utils/focus-visible-polyfill.js`](frontend/src/utils/focus-visible-polyfill.js)

## Performance Optimization Patterns

### useMemo for Expensive Computations

Memoize expensive calculations:

```javascript
const filteredResults = useMemo(() => {
  return results.filter(item => {
    // Expensive filtering logic
    return item.price >= minPrice && item.price <= maxPrice;
  });
}, [results, minPrice, maxPrice]);
```

**When to use useMemo:**
- Expensive computations in render
- Object/array creation in render
- Computations depending on multiple values

**Code Reference**: [`frontend/src/ResultList.jsx:36`](frontend/src/ResultList.jsx:36)

### Loading States with Skeletons

Skeleton components for better UX:

```javascript
const renderSkeletons = () => {
  return Array.from({ length: 6 }, (_, index) => (
    <SkeletonCard key={`skeleton-${index}`} />
  ));
};

return (
  <div>
    {isLoading ? renderSkeletons() : renderActualContent()}
  </div>
);
```

**Skeleton Best Practices:**
- Match actual content structure
- Use CSS animations for smooth transitions
- Limit skeleton count to prevent layout shift

**Code Reference**: [`frontend/src/ResultList.jsx:42-46`](frontend/src/ResultList.jsx:42-46)

## Testing Patterns

### Unit Test Structure (AAA Pattern)

Arrange, Act, Assert testing pattern:

```javascript
describe('ComponentName', () => {
  describe('Rendering', () => {
    it('renders correctly with valid props', () => {
      // Arrange
      const props = { /* test props */ };

      // Act
      render(<ComponentName {...props} />);

      // Assert
      expect(screen.getByText('Expected Text')).toBeInTheDocument();
    });
  });
});
```

**Test Organization:**
- Group tests by functionality
- Use descriptive test names
- Test both success and error cases

**Code Reference**: [`frontend/src/__tests__/components/GiftCard.test.jsx`](frontend/src/__tests__/components/GiftCard.test.jsx)

### Mocking Strategy with MSW

API mocking for reliable tests:

```javascript
import { server } from '../../mocks/server';

describe('API Integration', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('handles successful API response', async () => {
    // Test implementation
  });
});
```

**Mocking Best Practices:**
- Reset handlers between tests
- Mock error scenarios
- Use realistic test data

**Code Reference**: [`frontend/src/__tests__/hooks/useApi.test.js:16-19`](frontend/src/__tests__/hooks/useApi.test.js:16-19)

### Accessibility Testing

Automated accessibility testing:

```javascript
import { axe, toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);

it('has no accessibility violations', async () => {
  const { container } = render(<Component />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

**Accessibility Testing Coverage:**
- Color contrast
- Keyboard navigation
- Screen reader compatibility
- Semantic HTML structure

## Error Boundary Pattern

Graceful error handling (future implementation):

```javascript
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong. Please refresh the page.</div>;
    }

    return this.props.children;
  }
}
```

**Error Boundary Usage:**
- Wrap major component sections
- Provide fallback UI
- Log errors for monitoring

## Utility Functions

### Helper Functions Pattern

Pure utility functions for common operations:

```javascript
// utils/helpers.js
export const formatPrice = (price) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(price);
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};
```

**Utility Best Practices:**
- Keep functions pure and testable
- Use descriptive names
- Add JSDoc comments
- Export for reuse

## Code Organization Standards

### File Structure Convention

```
src/
├── components/          # Reusable UI components
│   ├── ComponentName.jsx
│   └── ComponentName.css
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
├── styles/             # Global styles and variables
├── mocks/              # API mocking for tests
└── __tests__/          # Test files
```

### Import Organization

Group imports by type and source:

```javascript
// React imports
import React, { useState, useEffect } from 'react';

// Third-party libraries
import PropTypes from 'prop-types';
import axios from 'axios';

// Local imports
import { useApi } from '../hooks/useApi';
import { formatPrice } from '../utils/helpers';
import './ComponentName.css';
```

**Import Order:**
1. React and React hooks
2. Third-party libraries (alphabetical)
3. Local imports (hooks, utils, components)
4. Styles

## Development Workflow

### Component Development Checklist

- [ ] Create component with proper structure
- [ ] Add PropTypes validation
- [ ] Implement accessibility features
- [ ] Add React.memo if appropriate
- [ ] Write comprehensive unit tests
- [ ] Test with screen readers
- [ ] Verify keyboard navigation
- [ ] Check responsive design
- [ ] Run accessibility tests

### Code Review Standards

- [ ] Component follows established patterns
- [ ] Proper error handling implemented
- [ ] Accessibility requirements met
- [ ] Performance optimizations applied
- [ ] Tests cover all scenarios
- [ ] Code is well-documented
- [ ] No console.log statements in production

This implementation guide serves as a reference for maintaining consistency and quality across the Santa's AI Gift Finder frontend codebase.