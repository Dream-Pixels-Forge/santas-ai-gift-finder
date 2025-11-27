# API Mocking Documentation

## Overview

The mocking system provides realistic API simulation for development and testing. Using Mock Service Worker (MSW), it intercepts network requests and returns predefined responses, enabling reliable testing and development without external API dependencies.

## Architecture

### Mock Service Worker (MSW)
MSW intercepts network requests at the service worker level, providing realistic API simulation without mocking the `fetch` API or XMLHttpRequest.

### File Structure
```
mocks/
├── server.js            # MSW server configuration
├── handlers.js          # API request handlers
└── test-utils.js        # Test utilities (future)
```

## Server Configuration

### MSW Server Setup
```javascript
// server.js
import { setupWorker } from 'msw';
import { handlers } from './handlers';

export const server = setupWorker(...handlers);
```

### Test Environment Setup
```javascript
// In test files
import { server } from '../mocks/server';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Development Environment Setup
```javascript
// In src/index.js (for development)
if (process.env.NODE_ENV === 'development') {
  const { worker } = require('./mocks/server');
  worker.start();
}
```

## API Handlers

### Handler Structure
```javascript
// handlers.js
import { http, HttpResponse } from 'msw';

export const handlers = [
  // HTTP method, endpoint, handler function
  http.post('/api/search', async ({ request }) => {
    // Handler logic
    return HttpResponse.json(responseData);
  })
];
```

### Request Handler Patterns

#### Successful Response
```javascript
http.post('/api/search', async ({ request }) => {
  const body = await request.json();
  const { query } = body;

  // Simulate processing
  if (!query || query.trim() === '') {
    return HttpResponse.json(
      { error: 'Search query is required' },
      { status: 400 }
    );
  }

  return HttpResponse.json({
    recommendations: mockGifts
  });
});
```

#### Error Response
```javascript
http.post('/api/search', async ({ request }) => {
  const body = await request.json();
  const { query } = body;

  if (query.includes('error')) {
    return HttpResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }

  return HttpResponse.json({ recommendations: [] });
});
```

#### Dynamic Response Based on Request
```javascript
http.get('/api/gift/:id', ({ params }) => {
  const { id } = params;
  const gift = mockGifts.find(g => g.id === parseInt(id));

  if (!gift) {
    return HttpResponse.json(
      { error: 'Gift not found' },
      { status: 404 }
    );
  }

  return HttpResponse.json({ gift });
});
```

## Mock Data

### Realistic Test Data
```javascript
export const mockGifts = [
  {
    id: 1,
    name: 'Art Supplies Set',
    description: 'Perfect for young artists who love drawing and painting',
    image: 'https://example.com/art-supplies.jpg',
    rating: 4.8,
    prices: [
      { retailer: 'Amazon', price: 29.99 },
      { retailer: 'Target', price: 34.99 }
    ]
  },
  // ... more mock gifts
];
```

### Data Generation Utilities
```javascript
// Future: Dynamic mock data generation
export const createMockGift = (overrides = {}) => ({
  id: Math.random(),
  name: 'Test Gift',
  description: 'A test gift description',
  image: 'https://example.com/test-gift.jpg',
  rating: 4.5,
  prices: [
    { retailer: 'Test Store', price: 19.99 }
  ],
  ...overrides
});
```

## Testing Integration

### Unit Test Setup
```javascript
describe('API Integration', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('handles successful search', async () => {
    const { result } = renderHook(() => useApi());

    await act(async () => {
      await result.current.request('/search', {
        method: 'POST',
        data: { query: 'birthday gift' }
      });
    });

    expect(result.current.error).toBe(null);
  });
});
```

### Handler Override in Tests
```javascript
it('handles API error', async () => {
  server.use(
    http.post('/api/search', () => {
      return HttpResponse.json(
        { error: 'Custom test error' },
        { status: 500 }
      );
    })
  );

  // Test error handling
});
```

### Integration Test Example
```javascript
describe('Search Flow', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('completes full search workflow', async () => {
    render(<App />);

    const searchInput = screen.getByLabelText(/search for gifts/i);
    const searchButton = screen.getByRole('button', { name: /search/i });

    await userEvent.type(searchInput, 'birthday gift');
    await userEvent.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText('Art Supplies Set')).toBeInTheDocument();
    });
  });
});
```

## Development Workflow

### Starting Mock Server
```javascript
// In development
import { server } from './mocks/server';

// Start MSW
server.start({
  onUnhandledRequest: 'warn' // Warn about unhandled requests
});
```

### Debugging Mocked Requests
```javascript
// Log all requests
server.events.on('request:start', ({ request }) => {
  console.log('MSW intercepted:', request.method, request.url);
});
```

### Hot Reloading Support
MSW automatically handles hot module reloading during development, ensuring mocks remain active during code changes.

## Handler Organization

### Grouping by Feature
```javascript
// handlers/search.js
export const searchHandlers = [
  http.post('/api/search', searchHandler),
  http.get('/api/suggestions', suggestionsHandler)
];

// handlers/gifts.js
export const giftHandlers = [
  http.get('/api/gifts', getGiftsHandler),
  http.post('/api/gifts', createGiftHandler)
];

// handlers/index.js
export const handlers = [
  ...searchHandlers,
  ...giftHandlers
];
```

### Environment-Specific Handlers
```javascript
const handlers = [
  // Common handlers
  ...commonHandlers,

  // Environment-specific handlers
  ...(process.env.NODE_ENV === 'test' ? testHandlers : []),
  ...(process.env.NODE_ENV === 'development' ? devHandlers : [])
];
```

## Advanced Features

### Request Matching
```javascript
// Exact path matching
http.get('/api/gifts', handler)

// Path parameters
http.get('/api/gifts/:id', ({ params }) => {
  const { id } = params;
  // Use id
})

// Query parameters
http.get('/api/search', ({ request }) => {
  const url = new URL(request.url);
  const query = url.searchParams.get('q');
  // Use query
})
```

### Response Delays
```javascript
// Simulate network latency
http.get('/api/gifts', async () => {
  await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
  return HttpResponse.json({ gifts: mockGifts });
});
```

### Dynamic Responses
```javascript
let giftId = 1;

http.post('/api/gifts', async ({ request }) => {
  const body = await request.json();
  const newGift = { id: giftId++, ...body };

  return HttpResponse.json({ gift: newGift }, { status: 201 });
});
```

## Best Practices

### Handler Guidelines
- **Realistic Responses**: Match actual API structure
- **Error Scenarios**: Include error case handlers
- **Consistent Data**: Use stable mock data for tests
- **Documentation**: Comment complex handler logic

### Testing Guidelines
- **Isolation**: Reset handlers between tests
- **Cleanup**: Properly stop server after tests
- **Realism**: Test with realistic data and scenarios
- **Coverage**: Mock all API endpoints used in tests

### Development Guidelines
- **Version Control**: Keep mock data in sync with API changes
- **Documentation**: Document mock behavior and limitations
- **Updates**: Update mocks when API contracts change

## Future Enhancements

### Planned Improvements
- **GraphQL Support**: Mock GraphQL queries and mutations
- **WebSocket Mocking**: Real-time data simulation
- **File Upload Mocking**: Form data and file handling
- **Authentication Simulation**: JWT token mocking

### Advanced Mocking
- **Stateful Mocks**: Maintain state between requests
- **Conditional Responses**: Context-aware response logic
- **Performance Simulation**: Variable response times
- **Error Injection**: Configurable error scenarios

## Maintenance

### Regular Tasks
- Update mock data to match API changes
- Add new handlers for new endpoints
- Review and update test scenarios
- Monitor mock realism and coverage

### API Contract Synchronization
When the backend API changes:
1. Update mock handlers to match new responses
2. Update mock data structure
3. Update tests to use new API contracts
4. Document breaking changes

### Performance Considerations
- **Bundle Size**: Minimize mock data for production builds
- **Load Time**: Optimize handler lookup performance
- **Memory Usage**: Clean up large mock datasets

This mocking system ensures reliable, fast, and comprehensive testing while providing a realistic development experience for the Santa's AI Gift Finder frontend application.