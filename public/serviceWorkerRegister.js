if ('serviceWorker' in navigator) {
  window.addEventListener('DOMContentLoaded', function () {
    // Check if running in iframe and has SSL issues
    const isInIframe = window !== window.top;
    const isHTTPS = location.protocol === 'https:';
    
    // Skip service worker registration if in iframe with potential SSL issues
    if (isInIframe && isHTTPS) {
      console.warn('Skipping ServiceWorker registration: Running in HTTPS iframe context');
      return;
    }
    
    navigator.serviceWorker.register('/serviceWorker.js').then(function (registration) {
      console.log('ServiceWorker registration successful with scope: ', registration.scope);
      const sw = registration.installing || registration.waiting
      if (sw) {
        sw.onstatechange = function() {
          if (sw.state === 'installed') {
            // SW installed.  Reload for SW intercept serving SW-enabled page.
            console.log('ServiceWorker installed reload page');
            window.location.reload();
          }
        }
      }
      registration.update().then(res => {
        console.log('ServiceWorker registration update: ', res);
      }).catch(err => {
        console.warn('ServiceWorker update failed: ', err);
      });
      window._SW_ENABLED = true
    }).catch(function (err) {
      console.warn('ServiceWorker registration failed: ', err);
      // Continue without service worker functionality
      if (err.name === 'SecurityError' || err.message.includes('SSL certificate error')) {
        console.warn('SSL certificate error detected. App will continue without ServiceWorker.');
      }
    });
    
    navigator.serviceWorker.addEventListener('controllerchange', function() {
      console.log('ServiceWorker controllerchange ');
      window.location.reload(true);
    });
  });
}
