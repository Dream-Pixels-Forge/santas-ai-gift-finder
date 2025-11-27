import { http, HttpResponse } from 'msw';

// Mock gift data for testing
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
  {
    id: 2,
    name: 'LEGO Creator Set',
    description: 'Build amazing creations with this versatile LEGO set',
    image: 'https://example.com/lego-set.jpg',
    rating: 4.9,
    prices: [
      { retailer: 'LEGO Store', price: 49.99 },
      { retailer: 'Walmart', price: 45.99 }
    ]
  },
  {
    id: 3,
    name: 'Science Experiment Kit',
    description: 'Fun and educational science experiments for curious minds',
    image: 'https://example.com/science-kit.jpg',
    rating: 4.7,
    prices: [
      { retailer: 'Amazon', price: 39.99 },
      { retailer: 'Michaels', price: 42.99 }
    ]
  },
  {
    id: 4,
    name: 'Board Game Collection',
    description: 'Family-friendly board games for game nights',
    image: 'https://example.com/board-games.jpg',
    rating: 4.6,
    prices: [
      { retailer: 'GameStop', price: 59.99 },
      { retailer: 'Target', price: 54.99 }
    ]
  },
  {
    id: 5,
    name: 'Musical Keyboard',
    description: 'Beginner-friendly keyboard for aspiring musicians',
    image: 'https://example.com/keyboard.jpg',
    rating: 4.5,
    prices: [
      { retailer: 'Best Buy', price: 89.99 },
      { retailer: 'Amazon', price: 79.99 }
    ]
  }
];

// Mock API responses
export const handlers = [
  // Search endpoint
  http.post('*/api/search', async ({ request }) => {
    const body = await request.json();
    const { query } = body;

    // Simulate different responses based on query
    if (!query || query.trim() === '') {
      return HttpResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    if (query.includes('error')) {
      return HttpResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }

    if (query.includes('empty')) {
      return HttpResponse.json(
        { recommendations: [] },
        { status: 200 }
      );
    }

    // Return mock gifts for successful searches
    return HttpResponse.json(
      { recommendations: mockGifts },
      { status: 200 }
    );
  }),

  // Fallback for any other API requests
  http.get('*/api/*', () => {
    return HttpResponse.json(
      { error: 'Not found' },
      { status: 404 }
    );
  }),

  http.post('*/api/*', () => {
    return HttpResponse.json(
      { error: 'Not found' },
      { status: 404 }
    );
  })
];