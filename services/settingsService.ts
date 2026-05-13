

import type { AppSettings, ChatMessage, CitySearchResult, ExportData } from '../types';

const SETTINGS_KEY = 'meteor_settings';
const WEATHER_CACHE_PREFIX = 'weather_data_';

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
    showDetailLabel: true,
    // V4.3 Zen Mode Defaults
    zenMode: {
        style: 'cinematic',
        background: 'image',
        showWeatherInfo: true,
        ambientSound: 'off',
        volume: 50
    },
    ...getPlatformDefaults() as any // Merge platform specific defaults
};

export interface BackupImportOptions {
    importSettings: boolean;
    importCache: boolean;
    importChat: boolean;
}

const BACKUP_SCHEMA_VERSION = 1;
const MAX_BACKUP_CONTENT_LENGTH = 2_000_000;

const ALLOWED_VIEW_VALUES = ['weather', 'ai', 'map', 'news', 'settings', 'tips', 'alerts', 'info'] as const;
const ALLOWED_STARTUP_BEHAVIOR_VALUES = ['last_location', 'idle', 'specific_location', 'custom_section'] as const;
const ALLOWED_THEME_VALUES = ['cyan', 'blue', 'purple', 'emerald', 'rose', 'amber'] as const;
const ALLOWED_TRANSPARENCY_VALUES = ['off', 'subtle', 'balanced', 'glass', 'transparent'] as const;
const ALLOWED_CLOCK_VALUES = ['always', 'different_zone', 'never'] as const;
const ALLOWED_BACKGROUND_VALUES = ['gradient', 'solid'] as const;
const ALLOWED_MAP_VALUES = ['light', 'dark'] as const;
const ALLOWED_BORDER_VALUES = ['none', 'top', 'bottom'] as const;
const ALLOWED_DENSITY_VALUES = ['comfortable', 'compact'] as const;
const ALLOWED_DATA_SOURCE_VALUES = ['auto', 'onecall', 'free', 'open-meteo'] as const;
const ALLOWED_INSIGHTS_STYLE_VALUES = ['container', 'clean'] as const;
const ALLOWED_INSIGHTS_CONTENT_VALUES = ['highlight', 'recommendation', 'both'] as const;
const ALLOWED_ZEN_STYLE_VALUES = ['cinematic', 'minimal', 'focus'] as const;
const ALLOWED_ZEN_BACKGROUND_VALUES = ['image', 'app'] as const;
const ALLOWED_ZEN_SOUND_VALUES = ['off', 'rain'] as const;
const ALLOWED_RAIN_VALUES = ['low', 'high'] as const;
const ALLOWED_UNIT_VALUES = ['metric', 'imperial'] as const;
const ALLOWED_FORECAST_COMPLEXITY_VALUES = ['basic', 'advanced'] as const;
const ALLOWED_FORECAST_DETAIL_VALUES = ['both', 'forecast_only', 'daily_only'] as const;

const isRecord = (value: unknown): value is Record<string, unknown> => (
    typeof value === 'object' && value !== null && !Array.isArray(value)
);

const readString = (value: unknown, maxLength: number): string | undefined => {
    if (typeof value !== 'string') return undefined;
    return value.slice(0, maxLength);
};

const readBoolean = (value: unknown): boolean | undefined => (
    typeof value === 'boolean' ? value : undefined
);

const readNumber = (value: unknown): number | undefined => (
    typeof value === 'number' && Number.isFinite(value) ? value : undefined
);

const readAllowedValue = <T extends string>(value: unknown, allowed: readonly T[]): T | undefined => {
    if (typeof value !== 'string') return undefined;
    return (allowed as readonly string[]).includes(value) ? value as T : undefined;
};

const cloneDefaultSettings = (): AppSettings => ({
    ...DEFAULT_SETTINGS,
    glassScope: { ...DEFAULT_SETTINGS.glassScope },
    rainAnimation: { ...DEFAULT_SETTINGS.rainAnimation },
    weatherInsights: { ...DEFAULT_SETTINGS.weatherInsights },
    zenMode: { ...DEFAULT_SETTINGS.zenMode },
});

const sanitizeCitySearchResult = (value: unknown): CitySearchResult | undefined => {
    if (!isRecord(value)) return undefined;

    const name = readString(value.name, 120);
    const country = readString(value.country, 120);
    const lat = readNumber(value.lat);
    const lon = readNumber(value.lon);

    if (!name || !country || lat === undefined || lon === undefined) return undefined;

    const sanitized: CitySearchResult = { name, country, lat, lon };
    const state = readString(value.state, 120);
    if (state) sanitized.state = state;

    return sanitized;
};

const sanitizeChatHistory = (value: unknown): ChatMessage[] => {
    if (!Array.isArray(value)) return [];

    return value
        .map((entry, index) => {
            if (!isRecord(entry)) return null;

            const role = entry.role === 'user' || entry.role === 'model' ? entry.role : null;
            const text = readString(entry.text, 12_000);
            if (!role || text === undefined) return null;

            return {
                id: readString(entry.id, 128) || `${Date.now()}-${index}`,
                role,
                text,
                sources: Array.isArray(entry.sources) ? entry.sources : undefined,
                modelUsed: readString(entry.modelUsed, 128),
                processingTime: readNumber(entry.processingTime),
                toolExecuted: readString(entry.toolExecuted, 128),
                timestamp: readNumber(entry.timestamp),
            } satisfies ChatMessage;
        })
        .filter((entry): entry is ChatMessage => entry !== null);
};

const sanitizeWeatherCache = (value: unknown): Record<string, any> => {
    if (!isRecord(value)) return {};

    const output: Record<string, any> = {};
    for (const [key, entry] of Object.entries(value)) {
        if (!key.startsWith(WEATHER_CACHE_PREFIX)) continue;
        output[key] = entry;
    }
    return output;
};

const sanitizeSettings = (value: unknown): AppSettings => {
    const settings = cloneDefaultSettings();
    if (!isRecord(value)) return settings;

    const userName = readString(value.userName, 30);
    if (userName !== undefined) settings.userName = userName;

    const userAiInstructions = readString(value.userAiInstructions, 200);
    if (userAiInstructions !== undefined) settings.userAiInstructions = userAiInstructions;

    const showClock = readBoolean(value.showClock);
    if (showClock !== undefined) settings.showClock = showClock;

    const clockDisplayMode = readAllowedValue(value.clockDisplayMode, ALLOWED_CLOCK_VALUES);
    if (clockDisplayMode) settings.clockDisplayMode = clockDisplayMode;

    const startFullscreen = readBoolean(value.startFullscreen);
    if (startFullscreen !== undefined) settings.startFullscreen = startFullscreen;

    const weatherSource = readAllowedValue(value.weatherSource, ALLOWED_DATA_SOURCE_VALUES);
    if (weatherSource) settings.weatherSource = weatherSource;

    const startupBehavior = readAllowedValue(value.startupBehavior, ALLOWED_STARTUP_BEHAVIOR_VALUES);
    if (startupBehavior) settings.startupBehavior = startupBehavior;

    const specificLocation = sanitizeCitySearchResult(value.specificLocation);
    if (specificLocation) settings.specificLocation = specificLocation;

    const startupSection = readAllowedValue(value.startupSection, ALLOWED_VIEW_VALUES);
    if (startupSection) settings.startupSection = startupSection;

    const saveChatHistory = readBoolean(value.saveChatHistory);
    if (saveChatHistory !== undefined) settings.saveChatHistory = saveChatHistory;

    const themeColor = readAllowedValue(value.themeColor, ALLOWED_THEME_VALUES);
    if (themeColor) settings.themeColor = themeColor;

    const dynamicTheme = readBoolean(value.dynamicTheme);
    if (dynamicTheme !== undefined) settings.dynamicTheme = dynamicTheme;

    const transparencyMode = readAllowedValue(value.transparencyMode, ALLOWED_TRANSPARENCY_VALUES);
    if (transparencyMode) settings.transparencyMode = transparencyMode;

    if (isRecord(value.glassScope)) {
        const header = readBoolean(value.glassScope.header);
        const cards = readBoolean(value.glassScope.cards);
        const overlays = readBoolean(value.glassScope.overlays);
        settings.glassScope = {
            header: header ?? settings.glassScope.header,
            cards: cards ?? settings.glassScope.cards,
            overlays: overlays ?? settings.glassScope.overlays,
        };
    }

    const backgroundMode = readAllowedValue(value.backgroundMode, ALLOWED_BACKGROUND_VALUES);
    if (backgroundMode) settings.backgroundMode = backgroundMode;

    const borderEffect = readAllowedValue(value.borderEffect, ALLOWED_BORDER_VALUES);
    if (borderEffect) settings.borderEffect = borderEffect;

    const mapTheme = readAllowedValue(value.mapTheme, ALLOWED_MAP_VALUES);
    if (mapTheme) settings.mapTheme = mapTheme;

    const layoutDensity = readAllowedValue(value.layoutDensity, ALLOWED_DENSITY_VALUES);
    if (layoutDensity) settings.layoutDensity = layoutDensity;

    const desktopLayout = readAllowedValue(value.desktopLayout, ['25-75', '40-60', '50-50'] as const);
    if (desktopLayout) settings.desktopLayout = desktopLayout;

    const showScrollbars = readBoolean(value.showScrollbars);
    if (showScrollbars !== undefined) settings.showScrollbars = showScrollbars;

    const performanceMode = readBoolean(value.performanceMode);
    if (performanceMode !== undefined) settings.performanceMode = performanceMode;

    const reducedMotion = readBoolean(value.reducedMotion);
    if (reducedMotion !== undefined) settings.reducedMotion = reducedMotion;

    if (isRecord(value.rainAnimation)) {
        const enabled = readBoolean(value.rainAnimation.enabled);
        const intensity = readAllowedValue(value.rainAnimation.intensity, ALLOWED_RAIN_VALUES);
        settings.rainAnimation = {
            enabled: enabled ?? settings.rainAnimation.enabled,
            intensity: intensity ?? settings.rainAnimation.intensity,
        };
    }

    if (isRecord(value.weatherInsights)) {
        const enabled = readBoolean(value.weatherInsights.enabled);
        const style = readAllowedValue(value.weatherInsights.style, ALLOWED_INSIGHTS_STYLE_VALUES);
        const content = readAllowedValue(value.weatherInsights.content, ALLOWED_INSIGHTS_CONTENT_VALUES);
        const showPulse = readBoolean(value.weatherInsights.showPulse);
        settings.weatherInsights = {
            enabled: enabled ?? settings.weatherInsights.enabled,
            style: style ?? settings.weatherInsights.style,
            content: content ?? settings.weatherInsights.content,
            showPulse: showPulse ?? settings.weatherInsights.showPulse,
        };
    }

    const unitSystem = readAllowedValue(value.unitSystem, ALLOWED_UNIT_VALUES);
    if (unitSystem) settings.unitSystem = unitSystem;

    const forecastComplexity = readAllowedValue(value.forecastComplexity, ALLOWED_FORECAST_COMPLEXITY_VALUES);
    if (forecastComplexity) settings.forecastComplexity = forecastComplexity;

    const forecastDetailView = readAllowedValue(value.forecastDetailView, ALLOWED_FORECAST_DETAIL_VALUES);
    if (forecastDetailView) settings.forecastDetailView = forecastDetailView;

    const showDetailLabel = readBoolean(value.showDetailLabel);
    if (showDetailLabel !== undefined) settings.showDetailLabel = showDetailLabel;

    if (isRecord(value.zenMode)) {
        const style = readAllowedValue(value.zenMode.style, ALLOWED_ZEN_STYLE_VALUES);
        const background = readAllowedValue(value.zenMode.background, ALLOWED_ZEN_BACKGROUND_VALUES);
        const showWeatherInfo = readBoolean(value.zenMode.showWeatherInfo);
        const ambientSound = readAllowedValue(value.zenMode.ambientSound, ALLOWED_ZEN_SOUND_VALUES);
        const volume = readNumber(value.zenMode.volume);
        settings.zenMode = {
            style: style ?? settings.zenMode.style,
            background: background ?? settings.zenMode.background,
            showWeatherInfo: showWeatherInfo ?? settings.zenMode.showWeatherInfo,
            ambientSound: ambientSound ?? settings.zenMode.ambientSound,
            volume: volume !== undefined ? Math.min(100, Math.max(0, volume)) : settings.zenMode.volume,
        };
    }

    return settings;
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
             else if (parsed.transparencyLevel === 'low') migratedSettings.transparencyMode = 'subtle';
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

        return sanitizeSettings(migratedSettings);
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

    let chatHistory: ChatMessage[] = [];
    try {
        const storedChat = localStorage.getItem('chat_history');
        if (storedChat) {
            chatHistory = sanitizeChatHistory(JSON.parse(storedChat));
        }
    } catch (e) {}

    let lastCoords: { lat: number; lon: number } | null = null;
    try {
        const storedCoords = localStorage.getItem('last_coords');
        if (storedCoords) {
            const parsedCoords = JSON.parse(storedCoords);
            if (isRecord(parsedCoords)) {
                const lat = readNumber(parsedCoords.lat);
                const lon = readNumber(parsedCoords.lon);
                if (lat !== undefined && lon !== undefined) {
                    lastCoords = { lat, lon };
                }
            }
        }
    } catch (e) {}

    const exportPayload: ExportData & { lastCoords?: any; schemaVersion: number } = {
        schemaVersion: BACKUP_SCHEMA_VERSION,
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
    options: BackupImportOptions
): boolean => {
    try {
        if (typeof jsonContent !== 'string' || jsonContent.length === 0 || jsonContent.length > MAX_BACKUP_CONTENT_LENGTH) {
            return false;
        }

        const data: unknown = JSON.parse(jsonContent);
        if (!isRecord(data)) return false;

        if (options.importSettings && data.settings) {
            saveSettings(sanitizeSettings(data.settings));
        }

        if (options.importCache && data.weatherCache) {
            const sanitizedCache = sanitizeWeatherCache(data.weatherCache);
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(WEATHER_CACHE_PREFIX)) {
                    localStorage.removeItem(key);
                }
            }
            Object.entries(sanitizedCache).forEach(([key, value]) => {
                localStorage.setItem(key, JSON.stringify(value));
            });
        }

        if (options.importChat && data.chatHistory) {
            localStorage.setItem('chat_history', JSON.stringify(sanitizeChatHistory(data.chatHistory)));
        }

        if (data.lastCoords && isRecord(data.lastCoords)) {
            const lat = readNumber(data.lastCoords.lat);
            const lon = readNumber(data.lastCoords.lon);
            if (lat !== undefined && lon !== undefined) {
                localStorage.setItem('last_coords', JSON.stringify({ lat, lon }));
            }
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
