

export type View = 'weather' | 'ai' | 'map' | 'news' | 'settings' | 'tips' | 'info';

export interface WeatherData {
  city: string;
  country: string;
  dt: number;
  temperature: number;
  condition: string;
  conditionIcon: string;
  windSpeed: number;
  humidity: number;
  pressure: number;
  imageUrl: string;
  timezoneOffset: number; // Added timezone offset in seconds
  uvi?: number;
  sunrise: number;
  sunset: number;
  feels_like?: number;
  visibility?: number;
  clouds?: number;
  wind_deg?: number;
  wind_gust?: number;
  rain_1h?: number;
  snow_1h?: number;
  dew_point?: number;
}

export interface AirQualityData {
    aqi?: number; 
    components: {
        co: number;
        no: number;
        no2: number;
        o3: number;
        so2: number;
        pm2_5: number;
        pm10: number;
        nh3: number;
    };
}

export interface HourlyForecast {
  dt: number;
  temperature: number;
  conditionIcon: string;
  pop?: number;
}

export interface DailyForecast {
  dt: number;
  temperature: number;
  conditionIcon: string;
  pop?: number;
}

export interface GroundingSource {
    uri: string;
    title: string;
}

export interface AiMetadata {
    model: string;
    timestamp: number;
    latencyMs?: number;
    commandsExecuted?: string[];
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'model' | 'system'; // System role for tool outputs
    text: string;
    sources?: GroundingSource[];
    metadata?: AiMetadata;
    isError?: boolean;
}

export interface CitySearchResult {
    name: string;
    country: string;
    state?: string;
    lat: number;
    lon: number;
}

export interface WeatherAlert {
    sender_name: string;
    event: string;
    start: number;
    end: number;
    description: string;
    tags: string[];
}

export type DataSource = 'onecall' | 'free' | 'open-meteo';

export interface AllWeatherData {
    weatherData: WeatherData;
    airQualityData: AirQualityData | null;
    hourlyForecast: HourlyForecast[];
    dailyForecast: DailyForecast[];
    alerts: WeatherAlert[];
    dataSource: DataSource;
    lastUpdated: number;
    fallbackStatus?: 'onecall_failed' | 'free_tier_failed' | null;
}

export interface SearchResultItem {
    title: string;
    link: string;
    snippet: string;
}

// --- SETTINGS TYPES ---

export type StartupBehavior = 'last_location' | 'idle' | 'specific_location' | 'custom_section';
export type AppTheme = 'cyan' | 'blue' | 'purple' | 'emerald' | 'rose' | 'amber';
export type TransparencyMode = 'off' | 'low' | 'glass';
export type ClockDisplayMode = 'always' | 'different_zone' | 'never';

export interface AppSettings {
    showClock: boolean; // System clock in header
    clockDisplayMode: ClockDisplayMode; // Local time in weather card
    startFullscreen: boolean;
    weatherSource: DataSource | 'auto';
    startupBehavior: StartupBehavior;
    specificLocation?: CitySearchResult; // Used if startupBehavior is 'specific_location'
    startupSection?: View; // Used if startupBehavior is 'custom_section'
    saveChatHistory: boolean;
    // AI Preferences
    userName?: string;
    aiInstructions?: string;
    // Visual Customization
    themeColor: AppTheme;
    dynamicTheme: boolean; 
    transparencyMode: TransparencyMode; // Replaces glassEffectEnabled
    showScrollbars: boolean;
    rainAnimation: {
        enabled: boolean;
        intensity: 'low' | 'high';
    };
}

export interface ExportData {
    settings: AppSettings;
    chatHistory: ChatMessage[]; // Placeholder for structure
    weatherCache: Record<string, any>; // Raw cache dump
    timestamp: number;
}
