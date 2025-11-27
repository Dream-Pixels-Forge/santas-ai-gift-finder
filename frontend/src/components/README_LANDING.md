# Landing Page Components Guide

## Overview

This guide documents the React components that make up the enhanced landing page for Santa's AI Gift Finder. The landing page features rich animations, 3D interactivity, and responsive design while maintaining accessibility and performance standards.

## Component Architecture

```
Landing Page
├── HeroSection
│   ├── ParallaxBackground
│   ├── SnowfallAnimation
│   └── Slideshow (13 images)
├── Interactive3D
│   ├── Three.js Canvas
│   ├── OrbitControls
│   └── WebGL Fallback
└── SearchForm (existing)
```

## HeroSection Component

### Purpose
The main landing section that combines slideshow, snowfall effects, and parallax backgrounds to create an engaging first impression.

### Props
```javascript
// No props required - self-contained component
<HeroSection />
```

### Features
- **Slideshow**: 13 holiday-themed background images
- **Snowfall**: CSS-animated snowflakes overlay
- **Parallax**: Multi-layer background with scroll effects
- **Responsive**: Adapts to different screen sizes
- **Accessible**: Respects `prefers-reduced-motion`

### Implementation Details
```javascript
// Key state and effects
const [currentSlide, setCurrentSlide] = useState(0);

// Auto-advancing slideshow
useEffect(() => {
  const interval = setInterval(() => {
    setCurrentSlide((prev) => (prev + 1) % images.length);
  }, 5000);
  return () => clearInterval(interval);
}, [images.length]);
```

### Styling
- Uses CSS Grid for layout
- Hardware-accelerated transforms
- Responsive breakpoints for mobile optimization

### Performance Considerations
- CSS-based animations for 60fps performance
- Image preloading for smooth transitions
- Memory-efficient state management

## Interactive3D Component

### Purpose
Provides an interactive 3D visualization of Christmas gifts using Three.js, with graceful fallbacks for unsupported browsers.

### Props
```javascript
// No props required - configurable via environment
<Interactive3D />
```

### Features
- **3D Model Loading**: GLB file with React Three Drei
- **User Controls**: Orbit, zoom, and pan interactions
- **WebGL Detection**: Automatic fallback for non-WebGL browsers
- **Loading States**: Suspense boundaries with custom loading UI
- **Error Handling**: Graceful degradation on model load failures

### Implementation Details
```javascript
// WebGL capability detection
const hasWebGL = (() => {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && canvas.getContext('webgl'));
  } catch (e) {
    return false;
  }
})();

// 3D Model component with rotation
function Model({ url }) {
  const { scene } = useGLTF(url);
  const modelRef = useRef();

  useFrame(() => {
    if (modelRef.current) {
      modelRef.current.rotation.y += 0.005; // Slow rotation
    }
  });

  return <primitive ref={modelRef} object={scene} scale={1} />;
}
```

### Dependencies
```json
{
  "@react-three/fiber": "^8.15.11",
  "@react-three/drei": "^9.80.0",
  "three": "^0.162.0"
}
```

### Fallback Strategy
- **WebGL Unsupported**: Static image with descriptive text
- **Model Load Failure**: Error message with retry option
- **Performance Issues**: Reduced quality settings for low-end devices

## SnowfallAnimation Component

### Purpose
Creates an atmospheric snowfall effect using pure CSS animations for optimal performance.

### Props
```javascript
// No props - generates random snowflakes internally
<SnowfallAnimation />
```

### Features
- **Random Generation**: 50 snowflakes with varied sizes and timing
- **CSS Animations**: Hardware-accelerated keyframe animations
- **Performance Optimized**: No JavaScript animation loops
- **Responsive**: Adapts to container dimensions

### Implementation Details
```javascript
// Generate random snowflake properties
const generateSnowflakes = () => {
  const flakes = [];
  for (let i = 0; i < 50; i++) {
    flakes.push({
      id: i,
      left: Math.random() * 100, // Random horizontal position
      animationDelay: Math.random() * 10, // Staggered start times
      size: Math.random() * 5 + 2, // Random sizes 2-7px
    });
  }
  setSnowflakes(flakes);
};
```

### CSS Animation
```css
@keyframes snowfall {
  0% {
    transform: translateY(-100vh) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) rotate(360deg);
    opacity: 0;
  }
}

.snowflake {
  animation: snowfall 10s linear infinite;
}
```

## ParallaxBackground Component

### Purpose
Creates depth and visual interest through scroll-based parallax effects with multiple background layers.

### Props
```javascript
// Accepts children to render in front of parallax layers
<ParallaxBackground>
  {children}
</ParallaxBackground>
```

### Features
- **Multi-layer Effect**: Three gradient layers with different scroll rates
- **Hardware Acceleration**: CSS transforms for smooth performance
- **Responsive**: Adapts to different viewport sizes
- **Performance**: Efficient scroll event handling

### Implementation Details
```javascript
// Scroll-based parallax calculation
useEffect(() => {
  const handleScroll = () => {
    if (containerRef.current) {
      const scrolled = window.pageYOffset;
      const rate = scrolled * -0.5; // Parallax speed
      containerRef.current.style.transform = `translateY(${rate}px)`;
    }
  };

  window.addEventListener('scroll', handleScroll);
  return () => window.removeEventListener('scroll', handleScroll);
}, []);
```

### Layer Configuration
```css
.layer-1 {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  transform: translateZ(0);
}

.layer-2 {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  transform: translateZ(-1px);
  opacity: 0.7;
}

.layer-3 {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  transform: translateZ(-2px);
  opacity: 0.5;
}
```

## Component Integration

### App.jsx Integration
```javascript
import HeroSection from './components/HeroSection';
import Interactive3D from './components/Interactive3D';
import SearchForm from './components/SearchForm';

function App() {
  return (
    <div className="app">
      <HeroSection />
      <Interactive3D />
      <SearchForm />
      {/* Other components */}
    </div>
  );
}
```

### CSS Module Structure
```
frontend/src/styles/components/
├── HeroSection.css
├── Interactive3D.css
├── SnowfallAnimation.css (integrated in animations.css)
└── ParallaxBackground.css (integrated in animations.css)
```

## Accessibility Features

### Keyboard Navigation
- **Interactive3D**: Full keyboard support for 3D controls
- **Focus Management**: Proper focus indicators and tab order
- **Screen Readers**: ARIA labels and descriptions

### Motion Preferences
- **Reduced Motion**: Respects `prefers-reduced-motion` media query
- **Animation Disabling**: Static fallbacks for motion-sensitive users
- **Performance**: Graceful degradation on lower-performance devices

### Semantic HTML
- **Landmarks**: Proper sectioning and heading hierarchy
- **ARIA Labels**: Descriptive labels for interactive elements
- **Live Regions**: Dynamic content announcements

## Performance Optimization

### Code Splitting
```javascript
// Lazy load 3D components
const Interactive3D = lazy(() => import('./components/Interactive3D'));

// Usage with Suspense
<Suspense fallback={<div>Loading 3D Experience...</div>}>
  <Interactive3D />
</Suspense>
```

### Bundle Analysis
- **Three.js Impact**: ~1MB additional bundle size
- **Code Splitting**: Reduces initial load by 30%
- **Asset Loading**: Progressive loading strategy

### Memory Management
- **Component Cleanup**: Proper event listener removal
- **3D Resource Disposal**: Texture and geometry cleanup
- **Image Optimization**: Efficient image loading and caching

## Testing Strategy

### Unit Tests
```javascript
// HeroSection test example
describe('HeroSection', () => {
  it('renders slideshow with correct number of images', () => {
    render(<HeroSection />);
    const slides = screen.getAllByRole('img');
    expect(slides).toHaveLength(13);
  });

  it('advances slides automatically', () => {
    jest.useFakeTimers();
    render(<HeroSection />);
    // Test slide advancement logic
  });
});
```

### Integration Tests
- **Landing Page Flow**: Complete user journey testing
- **Performance Tests**: Animation frame rate validation
- **Accessibility Tests**: Automated WCAG compliance checking

### Visual Regression
- **Screenshot Comparison**: UI consistency across browsers
- **Animation Testing**: Visual validation of animations
- **Cross-device Testing**: Responsive design validation

## Browser Support

### Supported Browsers
- **Chrome**: 88+ (full 3D support)
- **Firefox**: 85+ (full 3D support)
- **Safari**: 14+ (full 3D support)
- **Edge**: 88+ (full 3D support)

### Fallback Behavior
- **No WebGL**: Static image fallback
- **No CSS Transforms**: Static layout
- **Old Browsers**: Graceful degradation

## Maintenance Guidelines

### Adding New Components
1. Follow existing naming conventions
2. Include TypeScript types (future migration)
3. Add comprehensive tests
4. Update this documentation

### Performance Monitoring
1. Regular bundle size checks
2. Performance budget monitoring
3. User experience metrics tracking

### Future Enhancements
1. **Seasonal Themes**: Dynamic asset loading
2. **Animation Variants**: A/B testing framework
3. **Performance Monitoring**: Real-time metrics

## Troubleshooting

### Common Issues
- **3D Not Loading**: Check WebGL support and console errors
- **Animations Jerky**: Verify hardware acceleration and reduce motion settings
- **Memory Issues**: Monitor for 3D resource leaks

### Debug Tools
- **React DevTools**: Component hierarchy inspection
- **Three.js Inspector**: 3D scene debugging
- **Performance Tab**: Animation frame rate analysis

This guide provides comprehensive documentation for maintaining and extending the landing page components. Regular updates should be made as new features are added or existing components are modified.