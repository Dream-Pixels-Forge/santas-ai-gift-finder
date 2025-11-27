# Santa's AI Gift Finder API Documentation

This directory contains comprehensive API documentation for the Santa's AI Gift Finder backend.

## Files

- `openapi.yaml` - Complete OpenAPI 3.0.3 specification for the API
- `README.md` - This documentation file

## API Overview

The Santa's AI Gift Finder API provides AI-powered gift recommendations using natural language processing. Key features include:

- **Natural Language Processing**: Advanced NLP for understanding gift queries
- **Personalized Recommendations**: AI-powered gift matching based on age, interests, and relationships
- **Price Comparison**: Real-time price comparison across retailers
- **Caching**: High-performance Redis caching for optimal response times
- **Rate Limiting**: Built-in rate limiting to prevent abuse
- **Monitoring**: Comprehensive logging and metrics collection

## Quick Start

### Base URL
- Development: `http://localhost:5000`
- Production: `https://api.santas-gift-finder.com`

### Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

### Example Request
```bash
curl -X POST "http://localhost:5000/api/search" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "birthday gift for 10 year old boy who loves dinosaurs",
    "filters": {
      "age_min": 8,
      "age_max": 12,
      "price_max": 50
    }
  }'
```

## Key Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Search & Recommendations
- `POST /api/search` - Natural language gift search
- `POST /api/recommendations` - Personalized recommendations
- `POST /api/compare` - Price comparison

### Reference Data
- `GET /api/categories` - Available gift categories
- `GET /api/filters` - Filter options (ages, prices)

### Assets
- `GET /api/assets/list` - List available assets
- `GET /api/assets/images/{filename}` - Serve images
- `GET /api/assets/3d/{filename}` - Serve 3D models

### Monitoring
- `GET /api/health` - Health check
- `GET /api/metrics` - Performance metrics

## Response Format

All API responses follow a consistent format:

```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

Error responses:
```json
{
  "success": false,
  "error": "Error message",
  "data": null
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse:

- Authentication endpoints: 5 per minute for registration, 10 per minute for login
- Search endpoints: 30 per minute
- Asset endpoints: 100 per minute
- Other endpoints: 60 per minute

## Error Codes

- `200` - Success
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (authentication required)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

## Data Models

### Gift Recommendation
```json
{
  "id": 1,
  "name": "Dinosaur Fossil Dig Kit",
  "description": "Exciting archaeological adventure",
  "category": "science",
  "age_min": 6,
  "age_max": 12,
  "image": "/api/assets/images/hero-bg-01.jpg",
  "prices": [{"retailer": "Amazon", "price": 29.99}],
  "rating": 4.5,
  "relevance_score": 95.2
}
```

### Search Filters
```json
{
  "age_min": 8,
  "age_max": 12,
  "price_min": 20.00,
  "price_max": 100.00,
  "categories": ["toys", "books"]
}
```

## Development

### Viewing Documentation

You can view the API documentation using various tools:

1. **Swagger UI**: Import the `openapi.yaml` file into Swagger UI
2. **Postman**: Import the OpenAPI spec into Postman
3. **Insomnia**: Import the OpenAPI spec into Insomnia
4. **Redoc**: Use Redoc CLI to generate HTML documentation

### Generating HTML Documentation

```bash
# Install Redoc CLI
npm install -g redoc-cli

# Generate HTML documentation
redoc-cli bundle openapi.yaml -o api-docs.html
```

## Support

For API support or questions:
- Email: support@santas-gift-finder.com
- Documentation: https://docs.santas-gift-finder.com

## Version History

- **v1.0.0** - Initial release with core AI-powered search and recommendations