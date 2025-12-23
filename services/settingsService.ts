
import type { AppSettings, ExportData } from '../types';

const SETTINGS_KEY = 'meteor_settings';
const WEATHER_CACHE_PREFIX = 'weather_data_';
const AI_USAGE_KEY = 'meteor_ai_usage'; // Key used in geminiService.ts

// Helper to detect if user is on mobile
const isMobileDevice = (): boolean => {
    if (typeof window === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 1024;
};

// Generate defaults based on platform
const getPlatformDefaults = (): Partial<AppSettings> => {
    const isMobile = isMobileDevice();
    
    if (isMobile) {
        // Mobile Defaults (Performance Focused)
        return {
            transparencyMode: 'balanced', // User requested 'Equilibrado' as default
            borderEffect: 'bottom',
            layoutDensity: 'compact',
            rainAnimation: { enabled: true, intensity: 'low' },
            reducedMotion: true, // Disable global animations by default
            showScrollbars: false
        };
    } else {
        // Desktop Defaults (Visuals Focused)
        return {
            transparencyMode: 'glass', // Blur enabled
            borderEffect: 'top',
            layoutDensity: 'comfortable',
            rainAnimation: { enabled: true, intensity: 'high' },
            reducedMotion: false,
            showScrollbars: true
        };
    }
};

const DEFAULT_SETTINGS: AppSettings = {
    userName: '',
    userAiInstructions: '',
    showClock: true,
    clockDisplayMode: 'different_zone', // V4.0 Request: Default changed
    startFullscreen: false,
    weatherSource: 'auto',
    startupBehavior: 'idle',
    saveChatHistory: false,
    startupSection: 'weather',
    themeColor: 'purple',
    dynamicTheme: false,
    glassScope: {
        header: true,
        cards: true,
        overlays: true
    },
    backgroundMode: 'gradient',
    mapTheme: 'light',
    desktopLayout: '40-60',
    weatherInsights: {
        enabled: true,
        style: 'clean',
        content: 'both',
        showPulse: true
    },
    performanceMode: false,
    // V4.0 Defaults (Enabled by default as requested)
    unitSystem: 'metric',
    forecastComplexity: 'advanced', // Default to Advanced/Complex modal
    forecastDetailView: 'both',
    extrasConfig: {
        enabled: true, // Default enabled
        showRunning: true,
        showDriving: true,
        showGoldenHour: true,
        showBlueHour: true,
        showMosquito: true,
        showUV: true,
        showPollen: true,
        showFlu: true,
        showBeach: true
    },
    ...getPlatformDefaults() as any // Merge platform specific defaults
};

// --- SECURITY HELPERS ---
const encodeData = (data: string): string => {
    try {
        return btoa(encodeURIComponent(data).replace(/%([0-9A-F]{2})/g,
            (match, p1) => String.fromCharCode(parseInt(p1, 16)))
        );
    } catch (e) {
        console.error("Encoding failed", e);
        return data;
    }
};

const decodeData = (data: string): string => {
    try {
        return decodeURIComponent(atob(data).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
    } catch (e) {
        return data; 
    }
};
// ------------------------

export const getSettings = (): AppSettings => {
    try {
        const stored = localStorage.getItem(SETTINGS_KEY);
        if (!stored) return DEFAULT_SETTINGS;
        
        let parsed: any;

        if (stored.trim().startsWith('{')) {
            try {
                parsed = JSON.parse(stored);
            } catch (e) {
                console.error("Failed to parse legacy settings", e);
                return DEFAULT_SETTINGS;
            }
        } else {
            try {
                const decoded = decodeData(stored);
                parsed = JSON.parse(decoded);
            } catch (e) {
                try {
                     parsed = JSON.parse(stored);
                } catch (e2) {
                    console.error("Failed to parse settings", e2);
                    return DEFAULT_SETTINGS;
                }
            }
        }
        
        // --- START MIGRATION LOGIC ---
        let migratedSettings = { ...parsed };

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
            },
            weatherInsights: {
                ...DEFAULT_SETTINGS.weatherInsights,
                ...(migratedSettings.weatherInsights || {})
            },
            extrasConfig: {
                ...DEFAULT_SETTINGS.extrasConfig,
                ...(migratedSettings.extrasConfig || {})
            }
        };
    } catch (e) {
        console.error("Error loading settings:", e);
        return DEFAULT_SETTINGS;
    }
};

export const saveSettings = (settings: AppSettings) => {
    try {
        const json = JSON.stringify(settings);
        const encoded = encodeData(json);
        localStorage.setItem(SETTINGS_KEY, encoded);
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
                },
                weatherInsights: {
                    ...DEFAULT_SETTINGS.weatherInsights,
                    ...(data.settings.weatherInsights || {})
                },
                extrasConfig: {
                    ...DEFAULT_SETTINGS.extrasConfig,
                    ...(data.settings.extrasConfig || {})
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
