
import type { AppSettings, ExportData } from '../types';

const SETTINGS_KEY = 'meteor_settings';
const WEATHER_CACHE_PREFIX = 'weather_data_';

const DEFAULT_SETTINGS: AppSettings = {
    userName: '',
    showClock: true,
    startFullscreen: false,
    weatherSource: 'auto',
    startupBehavior: 'idle',
    aiCustomInstructions: '',
    startupSection: 'weather'
};

export const getSettings = (): AppSettings => {
    try {
        const stored = localStorage.getItem(SETTINGS_KEY);
        return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
    } catch (e) {
        console.error("Error loading settings:", e);
        return DEFAULT_SETTINGS;
    }
};

export const saveSettings = (settings: AppSettings) => {
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
        console.error("Error saving settings:", e);
    }
};

export const exportAppData = (): void => {
    const settings = getSettings();
    
    const weatherCache: Record<string, any> = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(WEATHER_CACHE_PREFIX)) {
            try {
                weatherCache[key] = JSON.parse(localStorage.getItem(key) || '{}');
            } catch (e) { /* ignore */ }
        }
    }

    const exportPayload: ExportData = {
        settings,
        chatHistory: [], // Placeholder for future implementation
        weatherCache,
        timestamp: Date.now()
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meteor_backup_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

export const importAppData = (
    jsonContent: string, 
    options: { importSettings: boolean, importCache: boolean, importChat: boolean }
): boolean => {
    try {
        const data: ExportData = JSON.parse(jsonContent);

        if (options.importSettings && data.settings) {
            // Merge imported settings with defaults to ensure compatibility
            const mergedSettings = { ...DEFAULT_SETTINGS, ...data.settings };
            saveSettings(mergedSettings);
        }

        if (options.importCache && data.weatherCache) {
            // Clear existing weather cache first
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(WEATHER_CACHE_PREFIX)) {
                    localStorage.removeItem(key);
                }
            }
            // Restore
            Object.entries(data.weatherCache).forEach(([key, value]) => {
                localStorage.setItem(key, JSON.stringify(value));
            });
        }
        
        return true;
    } catch (e) {
        console.error("Import failed:", e);
        return false;
    }
};

export const resetSettings = () => {
    localStorage.removeItem(SETTINGS_KEY);
};

export const resetCache = () => {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(WEATHER_CACHE_PREFIX)) {
            keysToRemove.push(key);
        }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
};

export const resetAllData = () => {
    localStorage.clear();
};
