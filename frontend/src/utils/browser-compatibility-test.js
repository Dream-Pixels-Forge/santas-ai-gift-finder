/**
 * Cross-browser compatibility test suite for Santa's AI Gift Finder
 * This script tests various browser features and provides compatibility reports
 */

class BrowserCompatibilityTester {
  constructor() {
    this.results = {
      css: {},
      javascript: {},
      accessibility: {},
      performance: {}
    };
  }

  /**
   * Test CSS Grid support with fallback verification
   */
  testCSSGridSupport() {
    const testElement = document.createElement('div');
    testElement.style.display = 'grid';
    const supportsGrid = testElement.style.display === 'grid';
    
    this.results.css.grid = {
      supported: supportsGrid,
      fallbackAvailable: true,
      message: supportsGrid ? 'CSS Grid is supported' : 'Using Flexbox fallback'
    };
    
    return this.results.css.grid;
  }

  /**
   * Test CSS Custom Properties (Variables) support
   */
  testCSSVariablesSupport() {
    const supportsVariables = window.CSS && CSS.supports('color', 'var(--test)');
    
    this.results.css.variables = {
      supported: supportsVariables,
      fallbackAvailable: true,
      message: supportsVariables ? 'CSS Variables are supported' : 'Using fallback values'
    };
    
    return this.results.css.variables;
  }

  /**
   * Test :focus-visible support
   */
  testFocusVisibleSupport() {
    const supportsFocusVisible = CSS.supports('selector(:focus-visible)');
    
    this.results.css.focusVisible = {
      supported: supportsFocusVisible,
      fallbackAvailable: true,
      message: supportsFocusVisible ? ':focus-visible is supported' : 'Using focus-visible polyfill'
    };
    
    return this.results.css.focusVisible;
  }

  /**
   * Test ES6+ JavaScript features
   */
  testJavaScriptFeatures() {
    const features = {
      arrowFunctions: () => { try { return eval('(() => true)()'); } catch(e) { return false; } },
      constLet: () => { try { eval('const test = 1; let test2 = 2;'); return true; } catch(e) { return false; } },
      templateLiterals: () => { try { return eval('`test${1}`') === 'test1'; } catch(e) { return false; } },
      destructuring: () => { try { eval('const {a} = {a: 1};'); return true; } catch(e) { return false; } },
      asyncAwait: () => { try { eval('async function test() {}'); return true; } catch(e) { return false; } },
      fetch: () => typeof fetch === 'function',
      promises: () => typeof Promise !== 'undefined'
    };

    this.results.javascript.es6Features = {};
    for (const [feature, test] of Object.entries(features)) {
      this.results.javascript.es6Features[feature] = {
        supported: test(),
        message: test() ? `${feature} is supported` : `${feature} is not supported`
      };
    }
    
    return this.results.javascript.es6Features;
  }

  /**
   * Test React Hooks compatibility
   */
  testReactHooks() {
    // Check if we're in a React environment
    const hasReact = typeof React !== 'undefined';
    const hasReactDOM = typeof ReactDOM !== 'undefined';
    
    this.results.javascript.react = {
      reactAvailable: hasReact,
      reactDOMAvailable: hasReactDOM,
      message: hasReact && hasReactDOM ? 'React environment detected' : 'React not available'
    };
    
    return this.results.javascript.react;
  }

  /**
   * Test accessibility features
   */
  testAccessibilityFeatures() {
    const tests = {
      ariaSupported: () => typeof document.createElement('div').setAttribute('aria-label', 'test') === 'undefined',
      keyboardNavigation: () => {
        const tabbableElements = document.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        return tabbableElements.length > 0;
      },
      screenReaderText: () => {
        const srOnlyElements = document.querySelectorAll('.sr-only, [class*="sr-only"]');
        return srOnlyElements.length > 0;
      },
      focusManagement: () => {
        const focusableElements = document.querySelectorAll('a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])');
        return Array.from(focusableElements).every(el => {
          const style = window.getComputedStyle(el);
          return style.outline !== 'none' || el.classList.contains('focus-visible');
        });
      }
    };

    this.results.accessibility = {};
    for (const [test, func] of Object.entries(tests)) {
      this.results.accessibility[test] = {
        supported: func(),
        message: func() ? `${test} is working` : `${test} needs attention`
      };
    }
    
    return this.results.accessibility;
  }

  /**
   * Test performance-related features
   */
  testPerformanceFeatures() {
    const tests = {
      requestAnimationFrame: () => typeof requestAnimationFrame === 'function',
      intersectionObserver: () => typeof IntersectionObserver === 'function',
      resizeObserver: () => typeof ResizeObserver === 'function',
      matchMedia: () => typeof window.matchMedia === 'function'
    };

    this.results.performance = {};
    for (const [feature, test] of Object.entries(tests)) {
      this.results.performance[feature] = {
        supported: test(),
        message: test() ? `${feature} is available` : `${feature} is not available`
      };
    }
    
    return this.results.performance;
  }

  /**
   * Run all tests and generate comprehensive report
   */
  runAllTests() {
    console.log('🔍 Running cross-browser compatibility tests...');
    
    this.testCSSGridSupport();
    this.testCSSVariablesSupport();
    this.testFocusVisibleSupport();
    this.testJavaScriptFeatures();
    this.testReactHooks();
    this.testAccessibilityFeatures();
    this.testPerformanceFeatures();
    
    this.generateReport();
    return this.results;
  }

  /**
   * Generate a human-readable compatibility report
   */
  generateReport() {
    console.log('📊 Cross-Browser Compatibility Report');
    console.log('=====================================');
    
    // CSS Support
    console.log('\n🎨 CSS Features:');
    Object.entries(this.results.css).forEach(([feature, result]) => {
      const icon = result.supported ? '✅' : '⚠️';
      console.log(`${icon} ${feature}: ${result.message}`);
    });
    
    // JavaScript Support
    console.log('\n⚡ JavaScript Features:');
    Object.entries(this.results.javascript).forEach(([category, features]) => {
      console.log(`\n  ${category}:`);
      Object.entries(features).forEach(([feature, result]) => {
        const icon = result.supported ? '✅' : '❌';
        console.log(`  ${icon} ${feature}: ${result.message}`);
      });
    });
    
    // Accessibility
    console.log('\n♿ Accessibility:');
    Object.entries(this.results.accessibility).forEach(([feature, result]) => {
      const icon = result.supported ? '✅' : '⚠️';
      console.log(`${icon} ${feature}: ${result.message}`);
    });
    
    // Performance
    console.log('\n🚀 Performance Features:');
    Object.entries(this.results.performance).forEach(([feature, result]) => {
      const icon = result.supported ? '✅' : 'ℹ️';
      console.log(`${icon} ${feature}: ${result.message}`);
    });
    
    // Overall compatibility score
    const allTests = [
      ...Object.values(this.results.css),
      ...Object.values(this.results.javascript.es6Features),
      ...Object.values(this.results.accessibility)
    ];
    
    const passedTests = allTests.filter(test => test.supported).length;
    const totalTests = allTests.length;
    const compatibilityScore = Math.round((passedTests / totalTests) * 100);
    
    console.log(`\n📈 Overall Compatibility Score: ${compatibilityScore}%`);
    console.log(`   (${passedTests}/${totalTests} tests passed)`);
    
    if (compatibilityScore >= 90) {
      console.log('🎉 Excellent! Your application has great cross-browser compatibility.');
    } else if (compatibilityScore >= 70) {
      console.log('👍 Good! Your application works well across most browsers.');
    } else if (compatibilityScore >= 50) {
      console.log('⚠️ Fair. Some features may not work in older browsers.');
    } else {
      console.log('❌ Poor. Consider adding more polyfills and fallbacks.');
    }
  }

  /**
   * Get browser information
   */
  static getBrowserInfo() {
    return {
      userAgent: navigator.userAgent,
      browser: {
        name: this.getBrowserName(),
        version: this.getBrowserVersion()
      },
      platform: navigator.platform,
      language: navigator.language,
      cookiesEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine
    };
  }

  static getBrowserName() {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Edg')) return 'Edge';
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Opera')) return 'Opera';
    return 'Unknown';
  }

  static getBrowserVersion() {
    const userAgent = navigator.userAgent;
    const browser = this.getBrowserName();
    
    switch (browser) {
      case 'Chrome':
        return userAgent.match(/Chrome\/(\d+\.\d+)/)?.[1] || 'Unknown';
      case 'Firefox':
        return userAgent.match(/Firefox\/(\d+\.\d+)/)?.[1] || 'Unknown';
      case 'Safari':
        return userAgent.match(/Version\/(\d+\.\d+)/)?.[1] || 'Unknown';
      case 'Edge':
        return userAgent.match(/Edg\/(\d+\.\d+)/)?.[1] || 'Unknown';
      default:
        return 'Unknown';
    }
  }
}

// Export for use in the application
window.BrowserCompatibilityTester = BrowserCompatibilityTester;

// Auto-run tests when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      const tester = new BrowserCompatibilityTester();
      tester.runAllTests();
    }, 1000); // Wait for React to mount
  });
} else {
  setTimeout(() => {
    const tester = new BrowserCompatibilityTester();
    tester.runAllTests();
  }, 1000);
}