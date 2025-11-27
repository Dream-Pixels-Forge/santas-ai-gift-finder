# Utilities Documentation

## Overview

The utilities directory contains helper functions, polyfills, and shared logic that support the Santa's AI Gift Finder application. These utilities promote code reusability, consistency, and maintainability across the codebase.

## Architecture

### Utility Organization
```
utils/
├── index.js              # Main exports
├── helpers.js            # General helper functions
├── focus-visible-polyfill.js  # Browser compatibility
├── browser-compatibility-test.js  # Feature detection
└── formatters.js         # Data formatting (future)
```

### Export Pattern
```javascript
// utils/index.js
export { formatPrice } from './helpers';
export { initFocusVisible } from './focus-visible-polyfill';
export { checkBrowserSupport } from './browser-compatibility-test';
```

## Available Utilities

### Helper Functions

**File**: `helpers.js`
**Purpose**: General-purpose utility functions

#### formatPrice
```javascript
/**
 * Formats a number as currency
 * @param {number} price - Price to format
 * @param {string} currency - Currency code (default: 'USD')
 * @returns {string} Formatted price string
 */
export const formatPrice = (price, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(price);
};

// Usage
formatPrice(29.99); // "$29.99"
formatPrice(29.99, 'EUR'); // "€29.99"
```

#### debounce
```javascript
/**
 * Debounces a function call
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
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

// Usage
const debouncedSearch = debounce(handleSearch, 300);
input.addEventListener('input', debouncedSearch);
```

#### throttle
```javascript
/**
 * Throttles a function call
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Usage
const throttledScroll = throttle(handleScroll, 100);
window.addEventListener('scroll', throttledScroll);
```

#### isEmpty
```javascript
/**
 * Checks if a value is empty
 * @param {*} value - Value to check
 * @returns {boolean} True if empty
 */
export const isEmpty = (value) => {
  if (value == null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

// Usage
isEmpty(''); // true
isEmpty([]); // true
isEmpty({}); // true
isEmpty('hello'); // false
```

### Focus Visible Polyfill

**File**: `focus-visible-polyfill.js`
**Purpose**: Provides focus-visible behavior for older browsers

#### Overview
The polyfill adds a `focus-visible` class to elements that receive keyboard focus, enabling better focus styling that distinguishes between mouse and keyboard interaction.

#### Features
- **Keyboard Detection**: Tracks whether the user is navigating with keyboard
- **Class Management**: Adds/removes `focus-visible` class appropriately
- **Cross-browser Support**: Works in browsers without native `:focus-visible` support

#### Usage
```javascript
// Automatic initialization (in index.js)
import './utils/focus-visible-polyfill';

// CSS usage
.button:focus-visible {
  outline: 2px solid blue;
  outline-offset: 2px;
}
```

#### API (for testing)
```javascript
// Exposed for testing
window.focusVisiblePolyfill = {
  addFocusVisibleClass,
  removeFocusVisibleClass,
  isValidFocusTarget
};
```

### Browser Compatibility Test

**File**: `browser-compatibility-test.js`
**Purpose**: Feature detection and browser support validation

#### Feature Detection
```javascript
/**
 * Tests for modern CSS and JavaScript features
 * @returns {Object} Feature support results
 */
export const checkBrowserSupport = () => {
  return {
    cssVariables: CSS.supports('color', 'var(--test)'),
    cssGrid: CSS.supports('display', 'grid'),
    es6: typeof Symbol !== 'undefined',
    fetch: typeof fetch !== 'undefined',
    promises: typeof Promise !== 'undefined'
  };
};

// Usage
const support = checkBrowserSupport();
if (!support.cssVariables) {
  // Load fallback styles
}
```

#### Browser Warnings
```javascript
/**
 * Shows browser compatibility warnings
 */
export const showCompatibilityWarning = () => {
  const support = checkBrowserSupport();

  if (!support.cssGrid) {
    console.warn('CSS Grid not supported. Using fallback layout.');
  }

  if (!support.fetch) {
    console.warn('Fetch API not supported. Using XMLHttpRequest fallback.');
  }
};
```

## Utility Patterns

### Pure Functions
All utilities follow functional programming principles:

```javascript
// Good: Pure function
export const calculateTotal = (items) => {
  return items.reduce((total, item) => total + item.price, 0);
};

// Avoid: Side effects
let total = 0;
export const addToTotal = (amount) => {
  total += amount; // Side effect
  return total;
};
```

### Error Handling
Robust error handling in utilities:

```javascript
export const safeParseJSON = (jsonString) => {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.warn('Failed to parse JSON:', error);
    return null;
  }
};
```

### Type Checking
Input validation for reliability:

```javascript
export const clamp = (value, min, max) => {
  if (typeof value !== 'number' || isNaN(value)) return min;
  if (typeof min !== 'number' || isNaN(min)) min = 0;
  if (typeof max !== 'number' || isNaN(max)) max = 100;

  return Math.min(Math.max(value, min), max);
};
```

## Testing Strategy

### Unit Tests for Utilities
```javascript
describe('formatPrice', () => {
  it('formats USD correctly', () => {
    expect(formatPrice(29.99)).toBe('$29.99');
    expect(formatPrice(0)).toBe('$0.00');
  });

  it('handles different currencies', () => {
    expect(formatPrice(29.99, 'EUR')).toBe('€29.99');
  });

  it('handles invalid inputs', () => {
    expect(formatPrice(null)).toBe('$0.00');
    expect(formatPrice('invalid')).toBe('$NaN');
  });
});
```

### Polyfill Testing
```javascript
describe('Focus Visible Polyfill', () => {
  it('adds focus-visible class on keyboard focus', () => {
    const button = document.createElement('button');
    document.body.appendChild(button);

    // Simulate keyboard focus
    const event = new KeyboardEvent('keydown', { key: 'Tab' });
    document.dispatchEvent(event);
    button.focus();

    expect(button.classList.contains('focus-visible')).toBe(true);
  });
});
```

## Performance Considerations

### Memoization
```javascript
// Cache expensive operations
const memoizedFormatPrice = (() => {
  const cache = new Map();
  return (price, currency = 'USD') => {
    const key = `${price}-${currency}`;
    if (cache.has(key)) return cache.get(key);

    const result = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(price);

    cache.set(key, result);
    return result;
  };
})();
```

### Lazy Loading
```javascript
// Dynamic imports for heavy utilities
export const loadHeavyUtility = async () => {
  const { heavyFunction } = await import('./heavy-utility');
  return heavyFunction;
};
```

## Future Enhancements

### Planned Utilities
- **Date Formatters**: Localized date/time formatting
- **Validation Helpers**: Form validation utilities
- **Storage Utilities**: Local storage with error handling
- **Animation Helpers**: CSS animation utilities
- **DOM Utilities**: Cross-browser DOM manipulation

### Advanced Features
- **Internationalization**: Multi-language support utilities
- **Performance Monitoring**: Utility usage tracking
- **Error Reporting**: Centralized error handling
- **Caching**: Response caching utilities

## Development Guidelines

### Adding New Utilities
1. **Identify Need**: Ensure utility solves a common problem
2. **Pure Functions**: Prefer pure, testable functions
3. **Documentation**: Add JSDoc comments
4. **Testing**: Write comprehensive unit tests
5. **Export**: Add to utils/index.js
6. **Performance**: Consider performance implications

### Code Standards
- Use ES6+ features appropriately
- Handle edge cases and errors gracefully
- Follow consistent naming conventions
- Keep functions focused and small
- Document complex logic

## Maintenance

### Regular Tasks
- Update dependencies quarterly
- Review performance and optimize if needed
- Add new utilities for common patterns
- Maintain test coverage above 80%

### Deprecation Strategy
- Mark deprecated utilities with console warnings
- Provide migration guides
- Maintain backward compatibility during transitions

### Monitoring
- Track utility usage and performance
- Monitor error rates from utility functions
- Analyze bundle size impact

This utilities system provides a solid foundation for shared functionality across the Santa's AI Gift Finder application, promoting code reuse and maintainability.