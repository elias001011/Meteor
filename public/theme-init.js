// Apply the saved appearance before the first paint, including cached/offline visits.
try {
  const settings = JSON.parse(localStorage.getItem('meteor_settings') || '{}');
  document.documentElement.dataset.theme = settings.backgroundMode === 'light' ? 'light' : 'dark';
} catch { document.documentElement.dataset.theme = 'dark'; }
