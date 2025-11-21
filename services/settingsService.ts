

import type { AppSettings, ExportData } from '../types';

const SETTINGS_KEY = 'meteor_settings';
const WEATHER_CACHE_PREFIX = 'weather_data_';
const AI_USAGE_KEY = 'meteor_ai_usage'; // Key used in geminiService.ts

const DEFAULT_SETTINGS: AppSettings = {
    showClock: true,
    clockDisplayMode: 'always', // Default to showing it always
    startFullscreen: false,
    weatherSource: 'auto',
    startupBehavior: 'idle',
    saveChatHistory: false, // Default to NOT saving history
    startupSection: 'weather', // Default to Weather to avoid crashes
    themeColor: 'purple',
    dynamicTheme: false,
    transparencyMode: 'glass', // Default to Glass
    glassScope: { // Default all enabled
        header: true,
        cards: true,
        overlays: true
    },
    backgroundMode: 'gradient', // Default to Gradient
    borderEffect: 'top', // Default to Top as requested
    mapTheme: 'light', // Default to Light as requested
    layoutDensity: 'comfortable', // Default
    showScrollbars: false, // Default to OFF for a cleaner, mobile-first UI
    performanceMode: false, // Default OFF
    reducedMotion: false, // Default OFF
    rainAnimation: {
        enabled: true,
        intensity: 'low'
    }
};

export const getSettings = (): AppSettings => {
    try {
        const stored = localStorage.getItem(SETTINGS_KEY);
        if (!stored) return DEFAULT_SETTINGS;
        
        const parsed = JSON.parse(stored);
        
        // --- START MIGRATION LOGIC ---
        let migratedSettings = { ...parsed };

        // Migrate legacy fields
        if (typeof parsed.glassEffectEnabled === 'boolean') {
            migratedSettings.transparencyMode = parsed.glassEffectEnabled ? 'glass' : 'off';
            delete migratedSettings.glassEffectEnabled;
        }
        if (typeof parsed.transparencyLevel === 'string') {
             if (parsed.transparencyLevel === 'none') migratedSettings.transparencyMode = 'off';
             else if (parsed.transparencyLevel === 'low') migratedSettings.transparencyMode = 'low';
             else migratedSettings.transparencyMode = 'glass';
             delete migratedSettings.transparencyLevel;
        }
        if (typeof migratedSettings.transparencyMode === 'undefined' && typeof parsed.enableTransparency === 'boolean') {
             migratedSettings.transparencyMode = parsed.enableTransparency ? 'glass' : 'off';
             delete migratedSettings.enableTransparency;
        }
        // Migrate boolean enableTopBorder to borderEffect string
        if (typeof parsed.enableTopBorder === 'boolean') {
            migratedSettings.borderEffect = parsed.enableTopBorder ? 'top' : 'none';
            delete migratedSettings.enableTopBorder;
        }
        // --- END MIGRATION LOGIC ---

        return {
            ...DEFAULT_SETTINGS,
            ...migratedSettings,
            glassScope: {
                ...DEFAULT_SETTINGS.glassScope,
                ...(migratedSettings.glassScope || {})
            },
            rainAnimation: {
                ...DEFAULT_SETTINGS.rainAnimation,
                ...(migratedSettings.rainAnimation || {})
            }
        };
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

    let chatHistory = [];
    try {
        const storedChat = localStorage.getItem('chat_history');
        if (storedChat) {
            chatHistory = JSON.parse(storedChat);
        }
    } catch (e) {}

    let lastCoords = null;
    try {
        const storedCoords = localStorage.getItem('last_coords');
        if (storedCoords) {
            lastCoords = JSON.parse(storedCoords);
        }
    } catch (e) {}

    const exportPayload: ExportData & { lastCoords?: any } = {
        settings,
        chatHistory,
        weatherCache,
        timestamp: Date.now(),
        lastCoords
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
        const data: ExportData & { lastCoords?: any } = JSON.parse(jsonContent);

        if (options.importSettings && data.settings) {
            // Merge with defaults to ensure new keys (like reducedMotion, layoutDensity) are present
            const mergedSettings = { 
                ...DEFAULT_SETTINGS, 
                ...data.settings,
                glassScope: {
                    ...DEFAULT_SETTINGS.glassScope,
                    ...(data.settings.glassScope || {})
                },
                rainAnimation: {
                    ...DEFAULT_SETTINGS.rainAnimation,
                    ...(data.settings.rainAnimation || {})
                }
            };
            saveSettings(mergedSettings);
        }

        if (options.importCache && data.weatherCache) {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(WEATHER_CACHE_PREFIX)) {
                    localStorage.removeItem(key);
                }
            }
            Object.entries(data.weatherCache).forEach(([key, value]) => {
                localStorage.setItem(key, JSON.stringify(value));
            });
        }

        if (options.importChat && data.chatHistory) {
            localStorage.setItem('chat_history', JSON.stringify(data.chatHistory));
        }

        if (data.lastCoords) {
            localStorage.setItem('last_coords', JSON.stringify(data.lastCoords));
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
    const aiUsage = localStorage.getItem(AI_USAGE_KEY);
    localStorage.clear();
    if (aiUsage) {
        localStorage.setItem(AI_USAGE_KEY, aiUsage);
    }
};