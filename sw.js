// This is a basic service worker file.
// It can be used for caching assets for offline use, push notifications, etc.

self.addEventListener('install', (event) => {
  console.log('Service worker installing...');
  // You can pre-cache app shell assets here
});

self.addEventListener('activate', (event) => {
  console.log('Service worker activating...');
  // Clean up old caches here
});

self.addEventListener('fetch', (event) => {
  // This basic service worker doesn't intercept any fetch requests.
  // It lets the browser handle them as it normally would.
  // console.log('Fetching:', event.request.url);
});
