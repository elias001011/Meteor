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
  dataSource: 'onecall' | 'fallback';
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

export interface ChatMessage {
    id: string;
    role: 'user' | 'model';
    text: string;
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