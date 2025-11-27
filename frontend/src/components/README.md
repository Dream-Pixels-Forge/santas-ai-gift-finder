# Components Documentation

## Overview

This directory contains reusable React components for the Santa's AI Gift Finder application. All components follow established patterns for consistency, performance, and accessibility.

## Component Architecture

### Design Principles
- **Modular**: Each component has a single responsibility
- **Reusable**: Components can be used across different parts of the application
- **Accessible**: WCAG 2.1 AA compliance with comprehensive ARIA support
- **Performant**: Optimized with React.memo and efficient rendering patterns
- **Testable**: Comprehensive unit tests with high coverage

### File Structure
```
components/
├── ComponentName.jsx      # Main component file
├── ComponentName.css      # Component-specific styles (if needed)
└── ComponentName.test.jsx # Unit tests
```

## Available Components

### SearchForm Component

**File**: `SearchForm.jsx`
**Purpose**: User input form for gift search queries

#### Props
```javascript
SearchForm.propTypes = {
  setResults: PropTypes.func.isRequired,  // Function to set search results
  setError: PropTypes.func.isRequired     // Function to set error state
};
```

#### Features
- Form validation with user-friendly error messages
- Loading state management during API calls
- Keyboard navigation support
- Screen reader accessibility with ARIA labels

#### Usage
```javascript
import SearchForm from './components/SearchForm';

<SearchForm setResults={handleSetResults} setError={setError} />
```

#### Accessibility
- `role="search"` for semantic search form
- Hidden label for screen readers
- ARIA live regions for dynamic error messages
- Required field indication

### SkeletonCard Component

**File**: `SkeletonCard.jsx`
**Purpose**: Loading placeholder component

#### Props
```javascript
SkeletonCard.propTypes = {
  // No props required - purely presentational
};
```

#### Features
- CSS-only animations for smooth loading experience
- Matches GiftCard layout structure
- Lightweight and performant

#### Usage
```javascript
import SkeletonCard from './components/SkeletonCard';

// Render multiple skeletons during loading
{isLoading && Array.from({ length: 6 }, (_, index) => (
  <SkeletonCard key={`skeleton-${index}`} />
))}
```

#### Styling
- Uses CSS animations with `opacity` and `transform`
- Responsive design matching actual content
- Consistent with design system variables

## Component Patterns

### React.memo Usage
All components use `React.memo` for performance optimization:

```javascript
const ComponentName = memo(({ prop1, prop2 }) => {
  // Component logic
  return <div>{/* JSX */}</div>;
});

ComponentName.displayName = 'ComponentName';
```

### PropTypes Validation
Comprehensive prop validation for all components:

```javascript
ComponentName.propTypes = {
  requiredProp: PropTypes.string.isRequired,
  optionalProp: PropTypes.arrayOf(PropTypes.object),
  callbackProp: PropTypes.func
};
```

### Error Boundaries (Future)
Components designed to work within error boundaries:

```javascript
// Usage in parent component
<ErrorBoundary>
  <SearchForm {...props} />
</ErrorBoundary>
```

## Styling Guidelines

### CSS Modules (Future Enhancement)
Components prepared for CSS Modules migration:

```css
/* ComponentName.module.css */
.componentName {
  /* Component-specific styles */
}

.componentName__element {
  /* Element-specific styles */
}

.componentName--modifier {
  /* Modifier styles */
}
```

### CSS Variables
All components use centralized design tokens:

```css
.myComponent {
  color: var(--color-primary);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
}
```

## Testing Strategy

### Unit Tests
Each component has comprehensive unit tests covering:

- **Rendering**: Correct display of props and state
- **Interactions**: User events and callbacks
- **Accessibility**: ARIA attributes and keyboard navigation
- **Edge Cases**: Null/undefined data handling
- **Performance**: Memoization verification

### Test Examples
```javascript
describe('SearchForm Component', () => {
  it('renders search input with correct attributes', () => {
    render(<SearchForm setResults={mockFn} setError={mockFn} />);

    const input = screen.getByLabelText(/search for gifts/i);
    expect(input).toHaveAttribute('type', 'text');
    expect(input).toHaveAttribute('aria-required', 'true');
  });

  it('handles form submission', async () => {
    const user = userEvent.setup();
    const mockSetResults = jest.fn();

    render(<SearchForm setResults={mockSetResults} setError={jest.fn()} />);

    const input = screen.getByLabelText(/search for gifts/i);
    const button = screen.getByRole('button', { name: /search/i });

    await user.type(input, 'birthday gift');
    await user.click(button);

    await waitFor(() => {
      expect(mockSetResults).toHaveBeenCalled();
    });
  });
});
```

## Accessibility Compliance

### WCAG 2.1 AA Requirements
- **Perceivable**: Alternative text, sufficient color contrast
- **Operable**: Keyboard navigation, sufficient time
- **Understandable**: Consistent navigation, error prevention
- **Robust**: Compatible with assistive technologies

### Implementation Checklist
- [x] Semantic HTML elements
- [x] ARIA labels and descriptions
- [x] Keyboard event handling
- [x] Focus management
- [x] Screen reader testing
- [x] Color contrast verification

## Performance Considerations

### Rendering Optimization
- Components wrapped with `React.memo`
- Callback functions stabilized with `useCallback`
- Expensive computations memoized with `useMemo`

### Bundle Size
- Components designed for code splitting
- Lazy loading for non-critical components
- Minimal dependencies

## Future Enhancements

### Planned Improvements
- **CSS Modules**: Migrate to scoped styling
- **Compound Components**: API design improvements
- **Error Boundaries**: Localized error handling
- **Suspense**: Loading state improvements

### Scalability Features
- **Theming**: Dynamic theme support
- **Internationalization**: Multi-language support
- **Responsive Design**: Enhanced mobile experience

## Development Guidelines

### Adding New Components
1. Create component file in appropriate directory
2. Add comprehensive PropTypes
3. Implement accessibility features
4. Write unit tests with 80%+ coverage
5. Add JSDoc comments
6. Update this documentation

### Code Standards
- Use functional components with hooks
- Prefer composition over inheritance
- Keep components focused on single responsibility
- Use TypeScript (future migration)
- Follow established naming conventions

## Maintenance

### Regular Tasks
- Update dependencies quarterly
- Review and update accessibility features
- Performance monitoring and optimization
- Test coverage maintenance

### Deprecation Strategy
- Mark deprecated props with console warnings
- Provide migration guides
- Maintain backward compatibility during transition periods

This documentation ensures consistent development and maintenance of React components across the Santa's AI Gift Finder application.