// Fix for Radix UI Dialog pointer-events issue
// This script ensures that pointer-events: none is never left on the body

(function() {
  'use strict';
  
  function cleanupBodyPointerEvents() {
    const body = document.body;
    if (body && body.style.pointerEvents === 'none') {
      body.style.pointerEvents = 'auto';
    }
  }
  
  // Clean up on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', cleanupBodyPointerEvents);
  } else {
    cleanupBodyPointerEvents();
  }
  
  // Clean up periodically (as a safety measure)
  setInterval(cleanupBodyPointerEvents, 1000);
  
  // Clean up when page visibility changes
  document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
      cleanupBodyPointerEvents();
    }
  });
  
  // Clean up on window focus
  window.addEventListener('focus', cleanupBodyPointerEvents);
  
  // Observer to watch for style changes on body
  if (typeof MutationObserver !== 'undefined') {
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'attributes' && 
            mutation.attributeName === 'style' && 
            mutation.target === document.body) {
          setTimeout(cleanupBodyPointerEvents, 50);
        }
      });
    });
    
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['style']
    });
  }
  
})();
