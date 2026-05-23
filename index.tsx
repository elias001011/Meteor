import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

type PwaInstallState = {
  canInstall: boolean;
  installed: boolean;
  supported: boolean;
};

declare global {
  interface Window {
    meteorInstallPwa?: () => Promise<boolean>;
    meteorGetPwaInstallState?: () => PwaInstallState;
  }
}

let deferredInstallPrompt: BeforeInstallPromptEvent | null = null;

const isPwaStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

const getPwaInstallState = (): PwaInstallState => ({
  canInstall: Boolean(deferredInstallPrompt),
  installed: isPwaStandalone(),
  supported: 'serviceWorker' in navigator && window.isSecureContext,
});

const dispatchPwaInstallState = () => {
  window.dispatchEvent(new CustomEvent('meteor:pwa-install-state', {
    detail: getPwaInstallState(),
  }));
};

window.meteorGetPwaInstallState = getPwaInstallState;
window.meteorInstallPwa = async () => {
  if (isPwaStandalone()) {
    return true;
  }

  if (!deferredInstallPrompt) {
    return false;
  }

  const promptEvent = deferredInstallPrompt;
  deferredInstallPrompt = null;
  dispatchPwaInstallState();

  await promptEvent.prompt();
  const choice = await promptEvent.userChoice;
  dispatchPwaInstallState();

  return choice.outcome === 'accepted';
};

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredInstallPrompt = event as BeforeInstallPromptEvent;
  dispatchPwaInstallState();
});

window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  dispatchPwaInstallState();
});

// Register service worker for PWA functionality
// We only attempt to register if it's supported. 
// Note: In development (Vite), sw.js might not be served at root, causing a console error.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Verifica se está em contexto seguro (HTTPS ou localhost)
    const isSecureContext = window.isSecureContext;
    if (!isSecureContext) {
      console.warn('Service Worker não pode ser registrado: contexto não seguro (requer HTTPS)');
      return;
    }
    
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('Service Worker registered with scope:', registration.scope);
      })
      .catch(err => {
        // Suppress the noisy error in console during development if sw.js isn't found or served as HTML
        if (err.message.includes('MIME type') || err.message.includes('404') || err.message.includes('Script has an unsupported MIME type')) {
             console.warn('Service Worker registration skipped (likely in development mode or sw.js missing).');
        } else if (err.message.includes('secure origin') || err.name === 'SecurityError') {
             console.warn('Service Worker requer HTTPS ou localhost para funcionar.');
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
