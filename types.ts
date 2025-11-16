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
  uvi?: number;
  sunrise: number;
  sunset: number;
}

export interface AirQualityData {
    aqi: number; // Index 1-5
    components: {
        co: number; // Carbon monoxide
        no: number; // Nitrogen monoxide
        no2: number; // Nitrogen dioxide
        o3: number; // Ozone
        so2: number; // Sulphur dioxide
        pm2_5: number; // Fine particles matter
        pm10: number; // Coarse particulate matter
        nh3: number; // Ammonia
    };
}

export interface HourlyForecast {
  dt: number;
  temperature: number;
  conditionIcon: string;
}

export interface DailyForecast {
  dt: number;
  temperature: number;
  conditionIcon: string;
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

export interface AllWeatherData {
    weatherData: WeatherData;
    airQualityData: AirQualityData | null;
    hourlyForecast: HourlyForecast[];
    dailyForecast: DailyForecast[];
    alerts: WeatherAlert[];
    dataSource: 'onecall' | 'free';
    lastUpdated: number;
}

export interface SearchResultItem {
    title: string;
    link: string;
    snippet: string;
}