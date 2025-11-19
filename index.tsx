import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Register service worker for PWA functionality
// We only attempt to register if it's supported. 
// Note: In development (Vite), sw.js might not be served at root, causing a console error.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('Service Worker registered with scope:', registration.scope);
      })
      .catch(err => {
        // Suppress the noisy error in console during development if sw.js isn't found or served as HTML
        if (err.message.includes('MIME type') || err.message.includes('404') || err.message.includes('Script has an unsupported MIME type')) {
             console.warn('Service Worker registration skipped (likely in development mode or sw.js missing).');
        } else {
             console.error('Service Worker registration failed:', err);
        }
      });
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);