

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
  timezoneOffset: number;
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
  description?: string; 
  feels_like?: number;
  humidity?: number;
  wind_speed?: number;
  uvi?: number;
  pressure?: number;
  clouds?: number;
}

export interface DailyForecast {
  dt: number;
  temperature: number; 
  temperature_min?: number; 
  conditionIcon: string;
  pop?: number;
  description?: string; 
  humidity?: number;
  wind_speed?: number;
  uvi?: number;
  clouds?: number;
  pressure?: number;
  sunrise?: number;
  sunset?: number;
}

export interface GroundingSource {
    uri: string;
    title: string;
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'model';
    text: string;
    sources?: GroundingSource[];
    modelUsed?: string;
    processingTime?: number;
    toolExecuted?: string;
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

export interface ExtrasData {
    pollen?: {
        alder: number;
        birch: number;
        grass: number;
        mugwort: number;
        olive: number;
        ragweed: number;
    } | null;
    marine?: {
        wave_height: number | null;
        sea_temperature: number;
    } | null;
}

// --- SETTINGS TYPES ---

export type StartupBehavior = 'last_location' | 'idle' | 'specific_location' | 'custom_section';
export type AppTheme = 'cyan' | 'blue' | 'purple' | 'emerald' | 'rose' | 'amber';
export type TransparencyMode = 'off' | 'subtle' | 'balanced' | 'glass' | 'transparent';
export type ClockDisplayMode = 'always' | 'different_zone' | 'never';
export type BackgroundMode = 'gradient' | 'solid';
export type MapTheme = 'light' | 'dark';
export type BorderEffectMode = 'none' | 'top' | 'bottom';
export type LayoutDensity = 'comfortable' | 'compact';
export type DesktopLayout = '25-75' | '40-60' | '50-50';

export type UnitSystem = 'metric' | 'imperial';
export type ForecastComplexity = 'basic' | 'advanced';
export type ForecastDetailView = 'both' | 'forecast_only' | 'daily_only';

export interface GlassScope {
    header: boolean;
    cards: boolean;
    overlays: boolean; 
}

export interface WeatherInsightsConfig {
    enabled: boolean;
    style: 'container' | 'clean';
    content: 'highlight' | 'recommendation' | 'both';
    showPulse: boolean;
}

export interface ExtrasConfig {
    enabled: boolean;
    showRunning: boolean;
    showDriving: boolean;
    showGoldenHour: boolean;
    showBlueHour: boolean;
    showMosquito: boolean;
    showUV: boolean;
    showPollen: boolean;
    showFlu: boolean;
    showBeach: boolean;
}

export interface AppSettings {
    userName?: string;
    userAiInstructions?: string;
    showClock: boolean;
    clockDisplayMode: ClockDisplayMode;
    startFullscreen: boolean;
    weatherSource: DataSource | 'auto';
    startupBehavior: StartupBehavior;
    specificLocation?: CitySearchResult;
    startupSection?: View;
    saveChatHistory: boolean;
    themeColor: AppTheme;
    dynamicTheme: boolean; 
    transparencyMode: TransparencyMode;
    glassScope: GlassScope;
    backgroundMode: BackgroundMode; 
    borderEffect: BorderEffectMode;
    mapTheme: MapTheme;
    layoutDensity: LayoutDensity;
    desktopLayout: DesktopLayout;
    showScrollbars: boolean;
    performanceMode: boolean;
    reducedMotion: boolean;
    rainAnimation: {
        enabled: boolean;
        intensity: 'low' | 'high';
    };
    weatherInsights: WeatherInsightsConfig;
    unitSystem: UnitSystem;
    forecastComplexity: ForecastComplexity;
    forecastDetailView: ForecastDetailView;
    extrasConfig: ExtrasConfig;
}

export interface ExportData {
    settings: AppSettings;
    chatHistory: ChatMessage[];
    weatherCache: Record<string, any>;
    timestamp: number;
}
