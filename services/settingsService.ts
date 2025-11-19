
import type { AppSettings, ExportData, AppNotification } from '../types';

const SETTINGS_KEY = 'meteor_settings';
const WEATHER_CACHE_PREFIX = 'weather_data_';
const NOTIFICATIONS_KEY = 'meteor_notifications';

const DEFAULT_SETTINGS: AppSettings = {
    userName: '',
    showClock: true,
    clockDisplayMode: 'always', // Default to showing it always
    startFullscreen: false,
    weatherSource: 'auto',
    startupBehavior: 'idle',
    aiCustomInstructions: '',
    saveChatHistory: false, // Default to NOT saving history
    startupSection: 'weather',
    themeColor: 'purple',
    dynamicTheme: false,
    transparencyMode: 'glass', // Default to Glass
    showScrollbars: false, // Default to OFF for a cleaner, mobile-first UI
    rainAnimation: {
        enabled: true,
        intensity: 'low'
    },
    notificationConfig: {
        enabled: false,
        historyEnabled: true, // Default on
        time: "08:00",
        days: [0, 1, 2, 3, 4, 5, 6], // Everyday
        location: undefined,
        separateAlerts: false
    }
};

export const getSettings = (): AppSettings => {
    try {
        const stored = localStorage.getItem(SETTINGS_KEY);
        if (!stored) return DEFAULT_SETTINGS;
        
        const parsed = JSON.parse(stored);
        
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
        // --- END MIGRATION LOGIC ---

        return {
            ...DEFAULT_SETTINGS,
            ...migratedSettings,
            rainAnimation: {
                ...DEFAULT_SETTINGS.rainAnimation,
                ...(migratedSettings.rainAnimation || {})
            },
            notificationConfig: {
                ...DEFAULT_SETTINGS.notificationConfig,
                ...(migratedSettings.notificationConfig || {})
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

    // Include chat history in export if it exists
    let chatHistory = [];
    try {
        const storedChat = localStorage.getItem('chat_history');
        if (storedChat) {
            chatHistory = JSON.parse(storedChat);
        }
    } catch (e) {}
    
    // Include notifications
    let notifications: AppNotification[] = [];
    try {
        const storedNotifs = localStorage.getItem(NOTIFICATIONS_KEY);
        if (storedNotifs) {
            notifications = JSON.parse(storedNotifs);
        }
    } catch (e) {}

    const exportPayload: ExportData = {
        settings,
        chatHistory,
        weatherCache,
        notifications,
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
            const mergedSettings = { 
                ...DEFAULT_SETTINGS, 
                ...data.settings,
                rainAnimation: {
                    ...DEFAULT_SETTINGS.rainAnimation,
                    ...(data.settings.rainAnimation || {})
                },
                 notificationConfig: {
                    ...DEFAULT_SETTINGS.notificationConfig,
                    ...(data.settings.notificationConfig || {})
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
        
        if (data.notifications) {
             localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(data.notifications));
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