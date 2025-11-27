# Styling System Documentation

## Overview

The styling system for Santa's AI Gift Finder uses a modular, scalable approach with CSS variables, component-scoped styles, and responsive design principles. The system ensures consistent theming, accessibility, and maintainability across the application.

## Architecture

### CSS Organization Structure
```
styles/
├── main.css              # Main stylesheet with imports
├── variables.css         # Design tokens and CSS variables
├── base.css             # Base styles and resets (future)
└── components/          # Component-scoped styles
    ├── App.css
    ├── SearchForm.css
    ├── GiftCard.css
    ├── Filters.css
    └── ResultList.css
```

### Import Hierarchy
```css
/* 1. CSS Variables and design tokens */
@import './variables.css';

/* 2. Base styles and utilities */
@import './base.css';

/* 3. Component-scoped styles */
@import './components/App.css';
@import './components/SearchForm.css';
/* ... other component styles */
```

## Design Tokens (CSS Variables)

### Color System
```css
:root {
  /* Primary Colors */
  --color-primary: #ff4757;
  --color-primary-hover: #ff3838;

  /* Semantic Colors */
  --color-success: #28a745;
  --color-error: #dc2626;
  --color-warning: #ffc107;

  /* Neutral Colors */
  --color-background: #f8f9fa;
  --color-surface: #ffffff;
  --color-text-primary: #333333;
  --color-text-secondary: #666666;
  --color-border: #dddddd;
}
```

### Spacing System
```css
:root {
  --spacing-xs: 0.25rem;    /* 4px */
  --spacing-sm: 0.5rem;     /* 8px */
  --spacing-md: 1rem;       /* 16px */
  --spacing-lg: 1.5rem;     /* 24px */
  --spacing-xl: 2rem;       /* 32px */
  --spacing-2xl: 3rem;      /* 48px */
}
```

### Typography Scale
```css
:root {
  --font-family: 'Arial', sans-serif;
  --font-size-xs: 0.75rem;   /* 12px */
  --font-size-sm: 0.875rem;  /* 14px */
  --font-size-base: 1rem;    /* 16px */
  --font-size-lg: 1.125rem;  /* 18px */
  --font-size-xl: 1.25rem;   /* 20px */
  --font-size-2xl: 1.5rem;   /* 24px */
}
```

### Layout System
```css
:root {
  --max-width: 1200px;
  --header-height: 200px;
  --border-radius-sm: 5px;
  --border-radius-md: 8px;
  --border-radius-lg: 10px;
}
```

### Shadow System
```css
:root {
  --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 5px 15px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 30px rgba(0, 0, 0, 0.2);
  --shadow-hover: 0 5px 20px rgba(0, 0, 0, 0.15);
}
```

### Animation System
```css
:root {
  --transition-fast: 0.2s ease;
  --transition-medium: 0.3s ease;
  --transition-slow: 0.5s ease;
}
```

## Component Styling Patterns

### BEM-like Naming Convention
```css
/* Block */
.component-name {
  /* Component styles */
}

/* Element */
.component-name__element {
  /* Element styles */
}

/* Modifier */
.component-name--modifier {
  /* Modifier styles */
}
```

### Example Implementation
```css
/* GiftCard.css */
.gift-card {
  background: var(--color-surface);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  padding: var(--spacing-lg);
  transition: var(--transition-medium);
}

.gift-card__image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: var(--radius-sm);
}

.gift-card__title {
  font-size: var(--font-size-lg);
  font-weight: bold;
  margin: var(--spacing-md) 0;
}

.gift-card--featured {
  border: 2px solid var(--color-primary);
  box-shadow: var(--shadow-lg);
}
```

## Responsive Design

### Breakpoint System
```css
/* Mobile First Approach */
@media (min-width: 768px) {
  .gift-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .gift-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1200px) {
  .container {
    max-width: var(--max-width);
    margin: 0 auto;
  }
}
```

### Fluid Typography
```css
/* Responsive font sizes */
.title {
  font-size: clamp(1.5rem, 4vw, 2.5rem);
}

.text {
  font-size: clamp(0.875rem, 2vw, 1.125rem);
}
```

## Accessibility Features

### Focus Management
```css
/* Focus visible styles */
.focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .button {
    border: 2px solid var(--color-text-primary);
  }
}
```

### Color Contrast
```css
/* Ensure sufficient contrast */
.text-primary {
  color: var(--color-text-primary);
}

.text-on-primary {
  color: white;
  background: var(--color-primary);
}
```

### Reduced Motion
```css
/* Respect user preferences */
@media (prefers-reduced-motion: reduce) {
  .animation {
    animation: none;
    transition: none;
  }
}
```

## Dark Mode Support

### CSS Variables for Theming
```css
/* Light mode (default) */
:root {
  --color-background: #f8f9fa;
  --color-surface: #ffffff;
  --color-text-primary: #333333;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  :root {
    --color-background: #1a1a1a;
    --color-surface: #2d2d2d;
    --color-text-primary: #ffffff;
    --color-text-secondary: #cccccc;
    --shadow-lg: 0 10px 30px rgba(0, 0, 0, 0.4);
  }
}
```

## Performance Optimizations

### CSS Containment
```css
.gift-card {
  contain: layout style paint;
  /* Improves rendering performance */
}
```

### Critical CSS (Future)
```css
/* Above the fold styles */
.critical-css {
  /* Minimal styles for initial render */
}
```

### CSS Grid and Flexbox
```css
/* Modern layout techniques */
.gift-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--spacing-lg);
}

.flex-container {
  display: flex;
  gap: var(--spacing-md);
  align-items: center;
}
```

## Browser Compatibility

### Fallbacks for Older Browsers
```css
/* CSS Variables fallback */
.component {
  color: #333333; /* Fallback */
  color: var(--color-text-primary); /* CSS Variable */
}

/* CSS Grid fallback */
.grid-container {
  display: flex; /* Fallback */
  display: grid; /* Modern */
  flex-wrap: wrap;
}
```

### Vendor Prefixes (Handled by Build)
```css
/* Autoprefixed by build process */
.transform-example {
  transform: translateX(10px);
  /* Becomes: */
  /* -webkit-transform: translateX(10px); */
  /* transform: translateX(10px); */
}
```

## Development Workflow

### Adding New Styles
1. **Identify Scope**: Component-specific or global
2. **Use Variables**: Leverage design tokens
3. **Follow Conventions**: BEM-like naming
4. **Test Responsiveness**: Mobile-first approach
5. **Verify Accessibility**: Contrast and focus styles

### Style Organization Checklist
- [ ] Uses CSS variables for design tokens
- [ ] Follows BEM naming convention
- [ ] Includes responsive breakpoints
- [ ] Has focus and hover states
- [ ] Supports dark mode
- [ ] Tested for accessibility
- [ ] Performance optimized

## Build Process

### CSS Processing
```javascript
// Build configuration (handled by CRA)
{
  "postcss": {
    "plugins": [
      "autoprefixer",
      "cssnano" // Minification
    ]
  }
}
```

### Output Optimization
- **Minification**: Removes whitespace and comments
- **Vendor Prefixing**: Automatic browser support
- **Source Maps**: Development debugging
- **Critical CSS**: Above-the-fold optimization (future)

## Future Enhancements

### CSS Modules Migration
```javascript
// Future: Scoped CSS modules
import styles from './Component.module.css';

<div className={styles.container}>
  <h1 className={styles.title}>Title</h1>
</div>
```

### CSS-in-JS (Alternative)
```javascript
// Styled-components approach (future consideration)
const StyledButton = styled.button`
  background: var(--color-primary);
  color: white;
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
`;
```

### Advanced Features
- **CSS Custom Properties**: Dynamic theming
- **Container Queries**: Component-based responsive design
- **CSS Grid Level 2**: Subgrid and masonry layouts
- **Houdini**: Custom CSS properties and animations

## Maintenance

### Regular Tasks
- Audit CSS variables usage
- Update color contrast ratios
- Review responsive breakpoints
- Optimize bundle size
- Update browser support matrix

### Performance Monitoring
- CSS bundle size tracking
- Unused CSS detection
- Render performance profiling
- Accessibility compliance checking

### Documentation Updates
- Maintain design token documentation
- Update component style guides
- Document new patterns and conventions

This styling system provides a solid foundation for consistent, accessible, and maintainable CSS across the Santa's AI Gift Finder application.