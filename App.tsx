import React, { useState, useCallback, useEffect } from 'react';
import WeatherView from './components/weather/WeatherView';
import AiView from './components/ai/AiView';
import MapView from './components/map/MapView';
import BottomNav from './components/layout/BottomNav';
import Header from './components/layout/Header';
import type { ChatMessage, View, WeatherData, AirQualityData, HourlyForecast, DailyForecast } from './types';
import { streamChatResponse } from './services/geminiService';
import DesktopWeather from './components/weather/DesktopWeather';
import PlaceholderView from './components/common/PlaceholderView';
import MobileAiControls from './components/ai/MobileAiControls';
import ErrorPopup from './components/common/ErrorPopup';

// Mock data, in a real app this would come from a weather service API
const mockWeatherData: WeatherData = {
  city: 'Porto Alegre',
  country: 'BR',
  date: 'Sexta-feira, 24 de Maio',
  temperature: 22,
  condition: 'Parcialmente Nublado',
  conditionIcon: '🌤️', // Using emoji for simplicity, would be an icon component
  windSpeed: 15,
  humidity: 75,
  pressure: 1012,
};

const mockAirQualityData: AirQualityData = {
    aqi: 42, // AQI value (e.g., from OpenWeatherMap)
};

const mockHourlyForecast: HourlyForecast[] = [
  { time: '14:00', temperature: 23, conditionIcon: '🌤️' },
  { time: '15:00', temperature: 23, conditionIcon: '☁️' },
  { time: '16:00', temperature: 22, conditionIcon: '☁️' },
  { time: '17:00', temperature: 21, conditionIcon: '🌥️' },
  { time: '18:00', temperature: 20, conditionIcon: '🌙' },
];

const mockDailyForecast: DailyForecast[] = [
  { day: 'Hoje', temperature: 23, conditionIcon: '🌤️' },
  { day: 'Sáb', temperature: 24, conditionIcon: '☀️' },
  { day: 'Dom', temperature: 21, conditionIcon: '🌦️' },
  { day: 'Seg', temperature: 20, conditionIcon: '🌧️' },
  { day: 'Ter', temperature: 22, conditionIcon: '☀️' },
];

const App: React.FC = () => {
  const [view, setView] = useState<View>('weather');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'model',
      text: 'Olá! Sou a IA do Meteor. Como posso ajudar com o clima hoje?',
    },
  ]);
  const [isSending, setIsSending] = useState(false);
  const [isBannerVisible, setIsBannerVisible] = useState(true);

  // Weather state
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [airQualityData, setAirQualityData] = useState<AirQualityData | null>(null);
  const [hourlyForecast, setHourlyForecast] = useState<HourlyForecast[]>([]);
  const [dailyForecast, setDailyForecast] = useState<DailyForecast[]>([]);
  const [weatherStatus, setWeatherStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    // This effect runs only once after the initial render to fetch weather data.
    // The data is then stored in the App component's state and persists
    // even when navigating between different views.
    const fetchWeatherData = () => {
        setWeatherStatus('loading');
        // Simulate API fetch 
        setTimeout(() => {
            setWeatherData(mockWeatherData);
            setAirQualityData(mockAirQualityData);
            setHourlyForecast(mockHourlyForecast);
            setDailyForecast(mockDailyForecast);
            setWeatherStatus('success');
        }, 1500); // Simulate 1.5 second delay
    };
    
    fetchWeatherData();
  }, []); // Empty dependency array ensures this runs only once on mount.

  const handleSendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text,
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsSending(true);

    const modelMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: '',
    };
    setMessages(prev => [...prev, modelMessage]);
    
    const stream = streamChatResponse(text);

    for await (const chunk of stream) {
        setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage.role === 'model') {
                lastMessage.text += chunk;
            }
            return newMessages;
        });
    }

    setIsSending(false);
  }, []);
  
  const weatherProps = {
    status: weatherStatus,
    weatherData,
    airQualityData,
    hourlyForecast,
    dailyForecast,
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen font-sans flex flex-col h-screen overflow-hidden">
      <Header activeView={view} setView={setView} />
      {isBannerVisible && (
        <ErrorPopup 
            message="Os dados são de exemplo e podem não refletir as condições atuais."
            onClose={() => setIsBannerVisible(false)}
        />
      )}

      <main className="flex-1 pt-16 overflow-hidden">
        {/* --- DESKTOP VIEW --- */}
        <div className="hidden lg:block h-full">
          {view === 'weather' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 h-full">
              <div className="overflow-y-auto pr-2 space-y-6">
                <DesktopWeather {...weatherProps} />
              </div>
              <div className="h-full rounded-3xl overflow-hidden">
                <MapView />
              </div>
            </div>
          )}
          {view === 'ai' && <AiView messages={messages} onSendMessage={handleSendMessage} isSending={isSending} />}
          {view === 'map' && <MapView />}
          {view === 'news' && <PlaceholderView title="Notícias" />}
          {view === 'settings' && <PlaceholderView title="Ajustes" />}
          {view === 'tips' && <PlaceholderView title="Dicas" />}
          {view === 'info' && <PlaceholderView title="Informações" />}
        </div>
        
        {/* --- MOBILE VIEW --- */}
        <div className="lg:hidden h-full">
          <div className={`${view === 'weather' ? 'block' : 'hidden'} h-full overflow-y-auto pb-24`}>
            <WeatherView {...weatherProps} />
          </div>
          <div className={`${view === 'ai' ? 'block' : 'hidden'} h-full`}>
            <AiView messages={messages} onSendMessage={handleSendMessage} isSending={isSending} />
          </div>
          <div className={`${view === 'map' ? 'block' : 'hidden'} h-full pb-24`}>
            <MapView />
          </div>
          <div className={`${view === 'news' ? 'block' : 'hidden'} h-full overflow-y-auto pb-24`}>
            <PlaceholderView title="Notícias" />
          </div>
           <div className={`${view === 'settings' ? 'block' : 'hidden'} h-full overflow-y-auto pb-24`}>
            <PlaceholderView title="Ajustes" />
          </div>
           <div className={`${view === 'tips' ? 'block' : 'hidden'} h-full overflow-y-auto pb-24`}>
            <PlaceholderView title="Dicas" />
          </div>
           <div className={`${view === 'info' ? 'block' : 'hidden'} h-full overflow-y-auto pb-24`}>
            <PlaceholderView title="Informações" />
          </div>
        </div>

      </main>
      
      <div className="lg:hidden">
        <BottomNav activeView={view} setView={setView} />
        <MobileAiControls 
            isVisible={view === 'ai'} 
            onSendMessage={handleSendMessage} 
            isSending={isSending} 
        />
      </div>
    </div>
  );
};

export default App;