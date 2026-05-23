import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

declare global {
  interface Window {
    meteorInstallPwa?: () => Promise<boolean>;
    meteorCanInstallPwa?: boolean;
  }
}

let deferredInstallPrompt: BeforeInstallPromptEvent | null = null;

const isPwaStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

const dispatchPwaInstallState = () => {
  window.dispatchEvent(new CustomEvent('meteor:pwa-install-state', {
    detail: {
      canInstall: Boolean(deferredInstallPrompt),
      installed: isPwaStandalone(),
    },
  }));
};

window.meteorCanInstallPwa = false;
window.meteorInstallPwa = async () => {
  if (isPwaStandalone()) {
    return true;
  }

  if (!deferredInstallPrompt) {
    return false;
  }

  const promptEvent = deferredInstallPrompt;
  deferredInstallPrompt = null;
  window.meteorCanInstallPwa = false;
  dispatchPwaInstallState();

  await promptEvent.prompt();
  const choice = await promptEvent.userChoice;
  dispatchPwaInstallState();

  return choice.outcome === 'accepted';
};

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredInstallPrompt = event as BeforeInstallPromptEvent;
  window.meteorCanInstallPwa = true;
  dispatchPwaInstallState();
});

window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  window.meteorCanInstallPwa = false;
  dispatchPwaInstallState();
});

const enhancePwaSettingsCard = () => {
  if (isPwaStandalone()) return;

  const title = Array.from(document.querySelectorAll('h4')).find((element) =>
    element.textContent?.trim() === 'Instale o Meteor'
  );

  const card = title?.closest('div.relative.overflow-hidden') as HTMLElement | null;
  const textContainer = title?.parentElement as HTMLElement | null;

  if (!card || !textContainer || card.querySelector('[data-meteor-pwa-install]')) {
    return;
  }

  const button = document.createElement('button');
  button.type = 'button';
  button.dataset.meteorPwaInstall = 'true';
  button.textContent = window.meteorCanInstallPwa ? 'Instalar' : 'Instalação indisponível';
  button.disabled = !window.meteorCanInstallPwa;
  button.className = [
    'mt-3',
    'px-4',
    'py-2',
    'rounded-xl',
    'text-sm',
    'font-bold',
    'transition-all',
    'border',
    window.meteorCanInstallPwa
      ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400/30 hover:bg-cyan-500/30 active:scale-95'
      : 'bg-white/5 text-gray-500 border-white/10 cursor-not-allowed',
  ].join(' ');

  button.addEventListener('click', async () => {
    if (!window.meteorInstallPwa) return;
    button.textContent = 'Abrindo instalação...';
    button.disabled = true;
    const installed = await window.meteorInstallPwa();
    button.textContent = installed ? 'Instalado' : 'Instalar';
    button.disabled = installed || !window.meteorCanInstallPwa;
  });

  textContainer.appendChild(button);
};

const startPwaSettingsEnhancer = () => {
  const update = () => requestAnimationFrame(enhancePwaSettingsCard);
  update();

  const observer = new MutationObserver(update);
  observer.observe(document.body, { childList: true, subtree: true });

  window.addEventListener('meteor:pwa-install-state', update);
};

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

startPwaSettingsEnhancer();