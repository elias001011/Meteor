
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
    aqi: number;
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
