# Deployment Guide

## Santa's AI Gift Finder - Frontend Deployment

This guide provides comprehensive instructions for deploying the Santa's AI Gift Finder frontend application, including environment configuration, build optimization, and production considerations.

## Deployment Architecture

### Supported Platforms
- **Primary**: Vercel (recommended for React applications)
- **Alternative**: Netlify, AWS S3 + CloudFront, traditional web servers
- **Backend**: Render (Flask API with PostgreSQL and Redis)

### Infrastructure Requirements
- **Build Time**: ~2-3 minutes for clean builds
- **Bundle Size**: ~300KB gzipped (optimized production build)
- **Node.js Version**: 16.x or higher
- **Build Dependencies**: npm packages defined in `package.json`

## Environment Configuration

### Environment Variables

#### Development (.env)
```env
# API Configuration
REACT_APP_API_URL=http://localhost:5000/api

# Development Settings
REACT_APP_ENV=development
```

#### Production (.env.production)
```env
# Production API Configuration
REACT_APP_API_URL=https://santas-ai-gift-finder-backend.onrender.com/api

# Production Settings
REACT_APP_ENV=production
```

**Security Note**: Never commit actual `.env` files to version control. Use `.env.example` as a template.

### Vercel Configuration

The `vercel.json` file handles routing and API proxying:

```json
{
  "version": 2,
  "name": "santas-ai-gift-finder-frontend",
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "https://santas-ai-gift-finder-backend.onrender.com/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "REACT_APP_API_URL": "https://santas-ai-gift-finder-backend.onrender.com/api"
  }
}
```

**Key Features:**
- API route proxying to backend
- SPA routing support (all routes serve `index.html`)
- Environment variable injection

## Build Process

### Production Build Command
```bash
npm run build
```

**Build Output:**
- `build/` directory containing optimized static files
- Source maps for debugging (optional)
- Service worker for caching (future implementation)
- Compressed assets (CSS, JS, images)

### Build Optimization Features

#### Code Splitting
- Automatic route-based splitting via React Router (future)
- Vendor chunk separation
- Dynamic imports for non-critical components

#### Asset Optimization
- CSS minification and optimization
- JavaScript minification with Terser
- Image optimization (future enhancement)
- Font loading optimization

#### Bundle Analysis
```bash
# Analyze bundle size
npm install -g webpack-bundle-analyzer
npm run build -- --analyze
```

### Build Artifacts

```
build/
├── index.html          # Main HTML file
├── static/
│   ├── css/
│   │   └── main.[hash].css    # Minified CSS
│   ├── js/
│   │   ├── main.[hash].js     # Main application bundle
│   │   └── runtime.[hash].js  # Webpack runtime
│   └── media/          # Images and assets
├── asset-manifest.json # Build manifest
└── robots.txt         # SEO configuration
```

## Deployment Platforms

### Vercel Deployment (Recommended)

#### Automated Deployment
1. **Connect Repository**
   - Import GitHub/GitLab repository
   - Set root directory to `/frontend`
   - Configure build settings

2. **Build Configuration**
   - **Framework**: React
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
   - **Install Command**: `npm install`

3. **Environment Variables**
   ```
   REACT_APP_API_URL=https://your-backend.onrender.com/api
   ```

4. **Domain Configuration**
   - Automatic HTTPS
   - Custom domain support
   - CDN edge network

#### Deployment Script Integration
```bash
# Using the provided deployment script
./deploy.sh
```

### Alternative Deployment Options

#### Netlify
```yaml
# netlify.toml
[build]
  command = "npm run build"
  publish = "build"

[build.environment]
  REACT_APP_API_URL = "https://your-backend.onrender.com/api"

[[redirects]]
  from = "/api/*"
  to = "https://your-backend.onrender.com/api/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### Docker Deployment
```dockerfile
# Dockerfile
FROM node:16-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Performance Optimization

### Core Web Vitals

#### Largest Contentful Paint (LCP)
- **Target**: <2.5 seconds
- **Optimization**: Image lazy loading, critical CSS inlining
- **Monitoring**: Vercel Analytics or Google PageSpeed Insights

#### First Input Delay (FID)
- **Target**: <100 milliseconds
- **Optimization**: Code splitting, minimal JavaScript execution
- **Implementation**: React.memo, useCallback, useMemo

#### Cumulative Layout Shift (CLS)
- **Target**: <0.1
- **Optimization**: Skeleton loading, fixed dimensions
- **Implementation**: CSS aspect ratios, font loading optimization

### CDN and Caching

#### Static Asset Caching
```nginx
# nginx.conf for static hosting
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

#### Service Worker (Future)
```javascript
// service-worker.js
const CACHE_NAME = 'santas-gift-finder-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/static/js/bundle.js',
        '/static/css/main.css'
      ]);
    })
  );
});
```

## Monitoring and Analytics

### Error Tracking
```javascript
// Error boundary with reporting
class ErrorBoundary extends Component {
  componentDidCatch(error, errorInfo) {
    // Report to error tracking service
    reportError(error, errorInfo);
  }
}
```

### Performance Monitoring
- **Vercel Analytics**: Built-in performance metrics
- **Google Analytics**: User behavior tracking
- **Sentry**: Error tracking and performance monitoring

### Health Checks
```javascript
// Health check endpoint (if needed)
fetch('/api/health')
  .then(response => {
    if (!response.ok) {
      // Report unhealthy state
    }
  });
```

## Security Considerations

### Content Security Policy
```html
<!-- index.html -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' https://santas-ai-gift-finder-backend.onrender.com;
">
```

### Environment Variable Security
- Never expose sensitive data in client-side code
- Use build-time environment variables only
- Server-side secrets remain on the backend

### Dependency Security
```bash
# Audit dependencies
npm audit

# Update dependencies securely
npm update

# Check for vulnerabilities
npm audit fix
```

## Troubleshooting

### Common Build Issues

#### react-scripts Not Found
```bash
# Clean reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

#### Build Fails with Dependency Errors
```bash
# Use exact versions
npm install --save-exact

# Clear npm cache
npm cache clean --force
```

#### Bundle Size Issues
```bash
# Analyze bundle
npm install -g webpack-bundle-analyzer
npm run build -- --analyze
```

### Runtime Issues

#### API Connection Problems
```javascript
// Check API connectivity
fetch('/api/health')
  .then(response => console.log('API Status:', response.status))
  .catch(error => console.error('API Error:', error));
```

#### CORS Issues
- Ensure backend allows frontend origin
- Check API URL configuration
- Verify environment variables

### Performance Issues

#### Slow Loading
- Check bundle size with `npm run build`
- Verify CDN configuration
- Test Core Web Vitals

#### Memory Leaks
- Use React DevTools Profiler
- Check for unnecessary re-renders
- Monitor component lifecycle

## Rollback Strategy

### Version Control
```bash
# Tag releases
git tag -a v1.0.0 -m "Production release v1.0.0"
git push origin v1.0.0
```

### Deployment Rollback
- **Vercel**: Use deployment history to rollback
- **Git**: Checkout previous commit and redeploy
- **Database**: Backup strategy for data changes

## Maintenance

### Regular Tasks

#### Dependency Updates
```bash
# Check for updates
npm outdated

# Update dependencies
npm update

# Test after updates
npm test
npm run build
```

#### Performance Monitoring
- Monthly Core Web Vitals review
- Bundle size monitoring
- Error rate tracking

#### Security Audits
```bash
# Regular security audits
npm audit
npm audit fix

# Update Node.js version periodically
# Test with new Node.js versions in CI
```

## Scaling Considerations

### Traffic Growth
- **Vercel**: Automatic scaling with global CDN
- **API**: Backend scaling on Render
- **Assets**: CDN optimization for static files

### Feature Flags
```javascript
// Feature flag implementation
const FEATURE_FLAGS = {
  advanced_filters: process.env.REACT_APP_ADVANCED_FILTERS === 'true',
  analytics: process.env.REACT_APP_ANALYTICS === 'true'
};
```

### Internationalization (Future)
- Multi-language support preparation
- RTL language support
- Currency and date localization

## Success Metrics

### Performance Targets
- **Lighthouse Score**: >90
- **Bundle Size**: <500KB gzipped
- **Time to Interactive**: <3 seconds
- **Accessibility Score**: 100 (WCAG AA)

### User Experience Metrics
- **Error Rate**: <1%
- **API Response Time**: <500ms
- **Search Success Rate**: >95%

### Business Metrics
- **Conversion Rate**: Track gift purchases
- **User Engagement**: Search frequency, filter usage
- **Retention**: Return visitor rate

This deployment guide ensures reliable, performant, and maintainable production deployments of the Santa's AI Gift Finder frontend application.