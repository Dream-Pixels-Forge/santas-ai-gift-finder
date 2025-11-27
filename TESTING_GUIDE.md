# Testing Guide

## Testing Strategy and Implementation

This guide outlines the comprehensive testing strategy implemented for the Santa's AI Gift Finder frontend application, ensuring code reliability, accessibility compliance, and maintainable development practices.

## Testing Pyramid

The application follows a balanced testing pyramid approach:

```
┌─────────────────┐  Future Implementation
│   E2E Tests     │  Cypress/Playwright
│  (User Flows)   │  User journey testing
├─────────────────┤
│ Integration     │  Component interaction
│    Tests        │  Cross-component behavior
├─────────────────┤
│   Unit Tests    │  Component & hook testing
│  (80% Coverage) │  Individual functionality
└─────────────────┘
```

## Testing Tools and Libraries

### Core Testing Framework
- **Jest**: JavaScript testing framework with built-in assertions
- **React Testing Library (RTL)**: React component testing utilities
- **User Event**: Realistic user interaction simulation

### Specialized Testing Tools
- **MSW (Mock Service Worker)**: API mocking and interception
- **jest-axe**: Automated accessibility testing
- **@testing-library/jest-dom**: Custom Jest matchers for DOM testing

### Configuration
```json
{
  "coverageThreshold": {
    "global": {
      "branches": 80,
      "functions": 80,
      "lines": 80,
      "statements": 80
    }
  }
}
```

**Code Reference**: [`frontend/package.json:22-32`](frontend/package.json:22-32)

## Test Organization Structure

```
frontend/src/__tests__/
├── components/           # Component unit tests
│   ├── GiftCard.test.jsx
│   └── ResultList.test.jsx
├── hooks/               # Custom hook tests
│   └── useApi.test.js
├── integration/         # Integration tests
│   └── filterFlow.test.jsx
├── utils/               # Utility function tests
│   └── helpers.test.js
└── test-utils.js        # Shared test utilities
```

## Unit Testing Patterns

### Component Testing (AAA Pattern)

**Arrange, Act, Assert** testing structure:

```javascript
describe('GiftCard Component', () => {
  const mockGift = createMockGift();

  describe('Rendering', () => {
    it('renders gift information correctly', () => {
      // Arrange
      render(<GiftCard gift={mockGift} />);

      // Act - implicit in render

      // Assert
      expect(screen.getByText('Test Gift')).toBeInTheDocument();
      expect(screen.getByText('$29.99')).toBeInTheDocument();
    });
  });
});
```

**Code Reference**: [`frontend/src/__tests__/components/GiftCard.test.jsx:13-25`](frontend/src/__tests__/components/GiftCard.test.jsx:13-25)

### Hook Testing with RTL

Testing custom hooks using renderHook:

```javascript
describe('useApi Hook', () => {
  it('returns initial state correctly', () => {
    const { result } = renderHook(() => useApi());

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(typeof result.current.request).toBe('function');
  });
});
```

**Code Reference**: [`frontend/src/__tests__/hooks/useApi.test.js:21-29`](frontend/src/__tests__/hooks/useApi.test.js:21-29)

### Async Testing Patterns

Testing asynchronous operations:

```javascript
it('handles successful API request', async () => {
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
});
```

**Code Reference**: [`frontend/src/__tests__/hooks/useApi.test.js:31-47`](frontend/src/__tests__/hooks/useApi.test.js:31-47)

## API Mocking Strategy

### Mock Service Worker (MSW) Implementation

Centralized API mocking for reliable testing:

```javascript
// mocks/handlers.js
export const handlers = [
  http.post('*/api/search', async ({ request }) => {
    const body = await request.json();
    const { query } = body;

    if (!query || query.trim() === '') {
      return HttpResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    return HttpResponse.json(
      { recommendations: mockGifts },
      { status: 200 }
    );
  })
];
```

**Code Reference**: [`frontend/src/mocks/handlers.js:63-96`](frontend/src/mocks/handlers.js:63-96)

### Test Setup with MSW

```javascript
describe('API Integration', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  // Tests here
});
```

**Code Reference**: [`frontend/src/__tests__/hooks/useApi.test.js:16-19`](frontend/src/__tests__/hooks/useApi.test.js:16-19)

## Accessibility Testing

### Automated Accessibility Testing

Using jest-axe for WCAG compliance:

```javascript
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Accessibility', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(<GiftCard gift={mockGift} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

**Code Reference**: [`frontend/src/__tests__/components/GiftCard.test.jsx:165-170`](frontend/src/__tests__/components/GiftCard.test.jsx:165-170)

### Keyboard Navigation Testing

Testing keyboard accessibility:

```javascript
describe('Keyboard Navigation', () => {
  it('supports keyboard navigation', async () => {
    const user = userEvent.setup();
    render(<GiftCard gift={mockGift} />);

    const button = screen.getByRole('button', { name: /buy test gift now/i });

    await user.tab();
    expect(button).toHaveFocus();
  });
});
```

**Code Reference**: [`frontend/src/__tests__/components/GiftCard.test.jsx:184-192`](frontend/src/__tests__/components/GiftCard.test.jsx:184-192)

## Test Utilities and Helpers

### Shared Test Utilities

```javascript
// test-utils.js
export const createMockGift = (overrides = {}) => ({
  id: 1,
  name: 'Test Gift',
  description: 'A test gift description',
  image: 'https://example.com/test-gift.jpg',
  rating: 4.5,
  prices: [
    { retailer: 'Amazon', price: 29.99 },
    { retailer: 'Target', price: 34.99 }
  ],
  ...overrides
});
```

### Custom Render Function

Extended render function for consistent testing:

```javascript
// Custom render with providers if needed
const customRender = (ui, options = {}) =>
  render(ui, { ...options });

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };
```

## Integration Testing

### Component Interaction Testing

Testing how components work together:

```javascript
describe('Filter Flow Integration', () => {
  it('filters results based on price range', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Simulate user search
    const searchInput = screen.getByLabelText(/search for gifts/i);
    await user.type(searchInput, 'birthday gift');
    await user.click(screen.getByRole('button', { name: /search/i }));

    // Wait for results
    await waitFor(() => {
      expect(screen.getByText('Art Supplies Set')).toBeInTheDocument();
    });

    // Apply filter
    const priceSelect = screen.getByLabelText('Price range filter');
    await user.click(priceSelect);
    // ... filter interaction
  });
});
```

**Code Reference**: [`frontend/src/__tests__/integration/filterFlow.test.jsx`](frontend/src/__tests__/integration/filterFlow.test.jsx)

## Performance Testing

### Component Performance Testing

Testing memoization and re-rendering:

```javascript
describe('Performance', () => {
  it('is memoized and does not re-render unnecessarily', () => {
    const { rerender } = render(<GiftCard gift={mockGift} />);
    const initialRender = screen.getByText('Test Gift');

    rerender(<GiftCard gift={mockGift} />);
    const secondRender = screen.getByText('Test Gift');

    expect(initialRender).toBe(secondRender);
  });
});
```

**Code Reference**: [`frontend/src/__tests__/components/GiftCard.test.jsx:217-228`](frontend/src/__tests__/components/GiftCard.test.jsx:217-228)

## Test Coverage Strategy

### Coverage Requirements

Minimum 80% coverage across all metrics:

- **Statements**: 80% - Executed code lines
- **Branches**: 80% - Conditional logic coverage
- **Functions**: 80% - Function execution
- **Lines**: 80% - Line-by-line coverage

### Coverage Configuration

```json
{
  "collectCoverageFrom": [
    "src/**/*.{js,jsx}",
    "!src/index.js",
    "!src/reportWebVitals.js",
    "!src/setupTests.js",
    "!src/mocks/**",
    "!src/**/*.test.{js,jsx}",
    "!src/__tests__/**"
  ]
}
```

**Code Reference**: [`frontend/package.json:33-42`](frontend/package.json:33-42)

### Coverage Reporting

Multiple output formats for different needs:

```json
{
  "test:coverage": "react-scripts test --coverage --watchAll=false --coverageReporters=text,html,lcov"
}
```

## Continuous Integration

### CI Pipeline Testing

Automated testing in CI/CD:

```yaml
# Example GitHub Actions
- name: Run Tests
  run: npm test -- --coverage --watchAll=false

- name: Run Accessibility Tests
  run: npm run test:a11y

- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    file: ./coverage/lcov.info
```

### Pre-commit Hooks

Quality gates before commits:

```javascript
// .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npm run test:coverage
npm run lint
```

## Mock Data Management

### Realistic Test Data

Structured mock data for consistent testing:

```javascript
export const mockGifts = [
  {
    id: 1,
    name: 'Art Supplies Set',
    description: 'Perfect for young artists',
    image: 'https://example.com/art-supplies.jpg',
    rating: 4.8,
    prices: [
      { retailer: 'Amazon', price: 29.99 },
      { retailer: 'Target', price: 34.99 }
    ]
  }
  // ... more mock gifts
];
```

**Code Reference**: [`frontend/src/mocks/handlers.js:4-60`](frontend/src/mocks/handlers.js:4-60)

## Error Scenario Testing

### API Error Testing

Testing error handling and edge cases:

```javascript
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
        // Expected error
      }
    });

    expect(result.current.error).toBe('Internal server error');
  });
});
```

**Code Reference**: [`frontend/src/__tests__/hooks/useApi.test.js:95-112`](frontend/src/__tests__/hooks/useApi.test.js:95-112)

## Testing Best Practices

### Test Naming Conventions

Descriptive test names following pattern:

```
describe('Component/Function Name', () => {
  describe('Behavior Category', () => {
    it('should description of expected behavior', () => {
      // Test implementation
    });
  });
});
```

### Test Isolation

Each test should be independent:

- Use `beforeEach` for setup
- Clean up after each test
- Avoid test interdependence
- Reset global state

### Assertion Best Practices

Clear and specific assertions:

```javascript
// Good: Specific assertions
expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Search');

// Avoid: Generic assertions
expect(container).toMatchSnapshot();
```

## Running Tests

### Test Commands

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- GiftCard.test.jsx
```

### Debugging Tests

Common debugging techniques:

```javascript
// Debug DOM structure
screen.debug();

// Debug specific element
const element = screen.getByText('text');
console.log(element.outerHTML);

// Pause execution
debugger;
```

## Future Testing Enhancements

### E2E Testing Implementation

```javascript
// Example Cypress test
describe('Gift Search Flow', () => {
  it('completes full search and filter flow', () => {
    cy.visit('/');
    cy.findByLabelText('Search for gifts').type('birthday gift');
    cy.findByRole('button', { name: /search/i }).click();
    cy.findByText('Art Supplies Set').should('be.visible');
  });
});
```

### Visual Regression Testing

```javascript
// Example with Chromatic or similar
describe('Visual Regression', () => {
  it('matches previous visual snapshot', () => {
    // Component rendering
    // Visual comparison
  });
});
```

### Performance Testing

```javascript
// Component performance testing
describe('Performance', () => {
  it('renders within performance budget', () => {
    const startTime = performance.now();
    render(<GiftCard gift={mockGift} />);
    const endTime = performance.now();

    expect(endTime - startTime).toBeLessThan(100); // 100ms budget
  });
});
```

This testing guide ensures the Santa's AI Gift Finder maintains high code quality, accessibility standards, and reliable functionality through comprehensive automated testing practices.