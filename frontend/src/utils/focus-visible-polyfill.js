/**
 * Focus-visible polyfill for browsers that don't support :focus-visible
 * This adds a 'focus-visible' class to elements that receive keyboard focus
 */

(function() {
  // Check if :focus-visible is supported
  const supportsFocusVisible = CSS.supports('selector(:focus-visible)');
  
  if (supportsFocusVisible) {
    return; // No polyfill needed
  }

  // Add class to html element to indicate we're using the polyfill
  document.documentElement.classList.add('js-focus-visible');

  // Track if user is using keyboard navigation
  let hadKeyboardEvent = false;
  const keyboardModalityWhitelist = [
    'input:not([type])',
    'input[type=text]',
    'input[type=search]',
    'input[type=url]',
    'input[type=tel]',
    'input[type=email]',
    'input[type=password]',
    'input[type=number]',
    'input[type=date]',
    'input[type=month]',
    'input[type=week]',
    'input[type=time]',
    'input[type=datetime-local]',
    'textarea',
    '[contenteditable]'
  ];

  const keyboardModalityWhitelistSelector = keyboardModalityWhitelist.join(',');

  function isValidFocusTarget(el) {
    if (el && el !== document.body && el.nodeName !== 'HTML') {
      return true;
    }
    return false;
  }

  function addFocusVisibleClass(el) {
    if (el.classList.contains('focus-visible')) {
      return;
    }
    el.classList.add('focus-visible');
    el.setAttribute('data-focus-visible-added', '');
  }

  function removeFocusVisibleClass(el) {
    if (!el.hasAttribute('data-focus-visible-added')) {
      return;
    }
    el.classList.remove('focus-visible');
    el.removeAttribute('data-focus-visible-added');
  }

  function onKeyDown(e) {
    if (e.key === 'Tab' || (e.key === 'Escape' && hadKeyboardEvent)) {
      hadKeyboardEvent = true;
    }
  }

  function onPointerDown() {
    hadKeyboardEvent = false;
  }

  function onFocus(e) {
    if (!isValidFocusTarget(e.target)) {
      return;
    }

    if (hadKeyboardEvent || e.target.matches(keyboardModalityWhitelistSelector)) {
      addFocusVisibleClass(e.target);
    }
  }

  function onBlur(e) {
    if (!isValidFocusTarget(e.target)) {
      return;
    }
    removeFocusVisibleClass(e.target);
  }

  function onVisibilityChange() {
    if (document.visibilityState === 'hidden') {
      hadKeyboardEvent = false;
    }
  }

  // Initialize event listeners
  document.addEventListener('keydown', onKeyDown, true);
  document.addEventListener('mousedown', onPointerDown, true);
  document.addEventListener('pointerdown', onPointerDown, true);
  document.addEventListener('touchstart', onPointerDown, true);
  document.addEventListener('focus', onFocus, true);
  document.addEventListener('blur', onBlur, true);
  document.addEventListener('visibilitychange', onVisibilityChange, true);

  // Export for testing
  window.focusVisiblePolyfill = {
    addFocusVisibleClass,
    removeFocusVisibleClass,
    isValidFocusTarget
  };
})();