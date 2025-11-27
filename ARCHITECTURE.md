# System Architecture Documentation

## Santa's AI Gift Finder - Frontend Architecture

This document provides a comprehensive overview of the frontend architecture for the Santa's AI Gift Finder application.

## System Overview

The Santa's AI Gift Finder is a React-based single-page application that provides AI-powered gift recommendations. The frontend communicates with a Python Flask backend API to fetch gift suggestions based on user queries.

## Architecture Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React App     │    │   Custom Hooks  │    │   API Layer     │
│                 │    │                 │    │                 │
│ • Components    │◄──►│ • useApi        │◄──►│ • Axios         │
│ • State Mgmt    │    │ • useState      │    │ • Environment   │
│ • Routing       │    │ • useCallback   │    │ • Error Handling│
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Components    │    │   Utilities     │    │   External APIs │
│                 │    │                 │    │                 │
│ • SearchForm    │    │ • Helpers       │    │ • Backend API   │
│ • GiftCard      │    │ • Polyfills     │    │ • MSW (testing) │
│ • Filters       │    │ • Formatters    │    │                 │
│ • ResultList    │    │                 │    └─────────────────┘
└─────────────────┘    └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│   Styling       │    │   Testing       │
│                 │    │                 │
│ • CSS Modules   │    │ • Jest          │
│ • CSS Variables │    │ • RTL           │
│ • Responsive    │    │ • MSW           │
│ • Accessibility │    │ • jest-axe      │
└─────────────────┘    └─────────────────┘
```

## Component Architecture

### Core Components

#### App Component [`frontend/src/App.jsx`](frontend/src/App.jsx)
- **Purpose**: Main application container and state management hub
- **Responsibilities**:
  - Global state management (results, filters, errors, loading)
  - Error display coordination
  - Component composition
- **State Management**: Local state with useState hooks
- **Performance**: Memoized with React.memo

#### SearchForm Component [`frontend/src/components/SearchForm.jsx`](frontend/src/components/SearchForm.jsx)
- **Purpose**: User input form for gift search queries
- **Responsibilities**:
  - Query input handling
  - Form validation
  - API request initiation
  - Loading state management
- **Accessibility**: ARIA labels, semantic HTML, keyboard navigation
- **Performance**: Memoized with useCallback for event handlers

#### ResultList Component [`frontend/src/ResultList.jsx`](frontend/src/ResultList.jsx)
- **Purpose**: Display filtered list of gift recommendations
- **Responsibilities**:
  - Gift filtering logic
  - Loading state rendering (skeleton cards)
  - Empty state handling
  - Results pagination (future)
- **Performance**: useMemo for filtered results computation

#### GiftCard Component [`frontend/src/GiftCard.jsx`](frontend/src/GiftCard.jsx)
- **Purpose**: Individual gift display component
- **Responsibilities**:
  - Gift information rendering
  - Price comparison display
  - Buy button interaction (placeholder)
  - Rating display
- **Accessibility**: Semantic HTML, ARIA attributes, keyboard navigation

#### Filters Component [`frontend/src/Filters.jsx`](frontend/src/Filters.jsx)
- **Purpose**: Price range filtering interface
- **Responsibilities**:
  - Multi-select price range input
  - Filter state updates
  - Accessibility compliance
- **Dependencies**: react-select library

### Supporting Components

#### SkeletonCard Component [`frontend/src/components/SkeletonCard.jsx`](frontend/src/components/SkeletonCard.jsx)
- **Purpose**: Loading state placeholder
- **Responsibilities**:
  - Animated skeleton rendering
  - Consistent layout preservation
- **Performance**: Lightweight CSS-only animations

## Custom Hooks

### useApi Hook [`frontend/src/hooks/useApi.js`](frontend/src/hooks/useApi.js)
- **Purpose**: Centralized API communication layer
- **Responsibilities**:
  - HTTP request handling
  - Loading state management
  - Error state management
  - URL construction
- **Features**:
  - Environment-based configuration
  - Automatic error parsing
  - Request/response interceptors
- **Dependencies**: Axios library

## State Management

### Local State Strategy
- **Decision**: Component-level state with React hooks
- **Rationale**: Current application complexity doesn't require global state management
- **Implementation**:
  - `useState` for component state
  - `useCallback` for stable function references
  - Prop drilling for state sharing

### State Flow
```
User Input → SearchForm → API Call → useApi Hook → State Update → Re-render
Filter Change → Filters → State Update → ResultList Filtering → Re-render
```

## Styling Architecture

### CSS Organization
```
styles/
├── main.css           # Main stylesheet with imports
├── variables.css      # Design tokens and CSS variables
├── base.css          # Base styles and resets
└── components/       # Component-scoped styles
    ├── App.css
    ├── SearchForm.css
    ├── GiftCard.css
    ├── Filters.css
    └── ResultList.css
```

### Design System
- **CSS Variables**: Centralized design tokens
- **Component Scoping**: Modular CSS approach
- **Responsive Design**: Mobile-first approach
- **Accessibility**: Focus management and high contrast support

### CSS Variables Structure
```css
:root {
  /* Colors */
  --color-primary: #ff4757;
  --color-background: #f8f9fa;

  /* Spacing */
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;

  /* Typography */
  --font-family: 'Arial', sans-serif;

  /* Layout */
  --max-width: 1200px;
}
```

## API Integration

### API Layer Design
- **HTTP Client**: Axios for requests
- **Configuration**: Environment variables with fallbacks
- **Error Handling**: Centralized error processing
- **Response Parsing**: JSON data transformation

### API Endpoints
```
POST /api/search
- Body: { query: string }
- Response: { recommendations: Gift[] }
```

### Environment Configuration
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL ||
  'https://santas-ai-gift-finder-backend.onrender.com/api';
```

## Testing Architecture

### Testing Pyramid
```
┌─────────────┐
│ E2E Tests   │ ← Future: Cypress/Playwright
│ (User Journeys)
├─────────────┤
│ Integration │ ← Component interaction tests
│ Tests       │
├─────────────┤
│ Unit Tests  │ ← Component and hook tests
│ (80% coverage)
└─────────────┘
```

### Testing Tools
- **Framework**: Jest with React Testing Library
- **API Mocking**: Mock Service Worker (MSW)
- **Accessibility**: jest-axe for automated a11y testing
- **Coverage**: 80% threshold across branches, functions, lines, statements

### Test Organization
```
__tests__/
├── components/     # Component unit tests
├── hooks/         # Custom hook tests
├── integration/   # Integration tests
└── utils/         # Utility function tests
```

## Performance Optimizations

### React Performance
- **Memoization**: React.memo for component memoization
- **Callback Stability**: useCallback for event handlers
- **Computation Caching**: useMemo for expensive calculations

### Bundle Optimization
- **Code Splitting**: Component-based splitting (future)
- **Tree Shaking**: Automatic dead code elimination
- **Asset Optimization**: Image lazy loading, WebP support (future)

### Runtime Performance
- **Loading States**: Skeleton components for perceived performance
- **Error Boundaries**: Graceful error handling
- **Memory Management**: Proper cleanup in useEffect

## Accessibility Architecture

### WCAG Compliance
- **Level**: WCAG 2.1 AA compliance
- **Testing**: Automated accessibility testing with jest-axe
- **Features**:
  - Semantic HTML structure
  - ARIA attributes and roles
  - Keyboard navigation support
  - Screen reader compatibility

### Accessibility Features
- **Focus Management**: Focus-visible polyfill
- **Live Regions**: Dynamic content announcements
- **Form Labels**: Proper labeling and descriptions
- **Color Contrast**: High contrast design system

## Build and Deployment

### Build Process
- **Tool**: Create React App (CRA)
- **Optimization**: Automatic code splitting and minification
- **Analysis**: Bundle size monitoring (future)

### Environment Configuration
- **Development**: Local proxy to backend
- **Production**: Environment variables for API URLs
- **Staging**: Separate environment for testing

### CDN Strategy
- **Static Assets**: Images, fonts, and CSS served via CDN
- **Caching**: Appropriate cache headers for performance
- **Fallbacks**: Graceful degradation for CDN failures

## Security Considerations

### Frontend Security
- **XSS Prevention**: React's automatic escaping
- **CSP Headers**: Content Security Policy (future)
- **Input Validation**: Client-side validation with server-side verification
- **Dependency Security**: Regular dependency updates and audits

### API Security
- **Authentication**: API key or token-based auth (future)
- **Request Validation**: Input sanitization
- **Rate Limiting**: Backend rate limiting implementation
- **HTTPS**: Secure communication channels

## Monitoring and Analytics

### Performance Monitoring
- **Core Web Vitals**: Loading, interactivity, visual stability
- **Bundle Size**: Regular bundle analysis
- **Runtime Performance**: React DevTools profiling

### Error Tracking
- **Client-side Errors**: Error boundary reporting
- **API Errors**: Centralized error logging
- **User Experience**: Error rate monitoring

### Analytics
- **User Behavior**: Search patterns and filter usage
- **Performance Metrics**: Page load times and interactions
- **Accessibility**: Usage patterns for accessibility features

## Future Architecture Evolution

### Scalability Considerations
- **State Management**: Migration to Zustand or Redux for complex state
- **Component Library**: Extract reusable components
- **Micro-frontends**: Architecture for larger applications

### Performance Enhancements
- **Service Worker**: Offline functionality and caching
- **Image Optimization**: WebP, lazy loading, responsive images
- **Code Splitting**: Route-based and component-based splitting

### Advanced Features
- **PWA**: Progressive Web App capabilities
- **Real-time**: WebSocket integration for live updates
- **Internationalization**: Multi-language support

This architecture provides a solid foundation for the Santa's AI Gift Finder application, balancing performance, accessibility, and maintainability while allowing for future growth and feature additions.