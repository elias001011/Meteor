export type View = 'weather' | 'ai' | 'map' | 'news' | 'settings' | 'tips' | 'info';

export interface WeatherData {
  city: string;
  country: string;
  date: string;
  temperature: number;
  condition: string;
  conditionIcon: string;
  windSpeed: number;
  humidity: number;
  pressure: number;
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
  time: string;
  temperature: number;
  conditionIcon: string;
}

export interface DailyForecast {
  day: string;
  temperature: number;
  conditionIcon: string;
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'model';
    text: string;
}

export interface WeatherAlert {
    event: string;
    description: string;
    sender_name: string;
}

export interface CitySearchResult {
    name: string;
    country: string;
    state?: string;
    lat: number;
    lon: number;
}
