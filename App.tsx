import React, { useState, useCallback, useEffect } from 'react';
import WeatherView from './components/weather/WeatherView';
import AiView from './components/ai/AiView';
import MapView from './components/map/MapView';
import BottomNav from './components/layout/BottomNav';
import Header from './components/layout/Header';
import type { ChatMessage, View, WeatherData, AirQualityData, HourlyForecast, DailyForecast, CitySearchResult, WeatherAlert } from './types';
import { streamChatResponse } from './services/geminiService';
import { fetchAllWeatherData } from './services/weatherService';
import DesktopWeather from './components/weather/DesktopWeather';
import PlaceholderView from './components/common/PlaceholderView';
import MobileAiControls from './components/ai/MobileAiControls';

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

  // Weather state
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [airQualityData, setAirQualityData] = useState<AirQualityData | null>(null);
  const [hourlyForecast, setHourlyForecast] = useState<HourlyForecast[]>([]);
  const [dailyForecast, setDailyForecast] = useState<DailyForecast[]>([]);
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [weatherStatus, setWeatherStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [weatherError, setWeatherError] = useState<string | null>(null);

  const handleFetchWeather = useCallback(async (coords: { lat: number; lon: number }, cityInfo?: { name: string; country: string }) => {
    setWeatherStatus('loading');
    setWeatherError(null);
    try {
      const data = await fetchAllWeatherData(coords.lat, coords.lon, cityInfo);
      setWeatherData(data.weatherData);
      setAirQualityData(data.airQualityData);
      setHourlyForecast(data.hourlyForecast);
      setDailyForecast(data.dailyForecast);
      setAlerts(data.alerts);
      setWeatherStatus('success');
    } catch (error) {
      console.error("Failed to fetch weather data:", error);
      setWeatherError(error instanceof Error ? error.message : "Um erro desconhecido ocorreu.");
      setWeatherStatus('error');
    }
  }, []);
  
  const handleCitySelect = useCallback((city: CitySearchResult) => {
    handleFetchWeather({ lat: city.lat, lon: city.lon }, { name: city.name, country: city.country });
  }, [handleFetchWeather]);

  const fetchUserLocationWeather = useCallback(() => {
    setWeatherStatus('loading');
    setWeatherError(null);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          handleFetchWeather({ lat: position.coords.latitude, lon: position.coords.longitude });
        },
        (error) => {
          console.warn(`Geolocation error: ${error.message}.`);
          setWeatherError("Não foi possível obter sua localização. Verifique as permissões do seu navegador e tente novamente.");
          setWeatherStatus('error');
        }
      );
    } else {
      console.warn("Geolocation is not supported by this browser.");
      setWeatherError("Geolocalização não é suportada neste navegador.");
      setWeatherStatus('error');
    }
  }, [handleFetchWeather]);

  const initialLoad = useCallback(() => {
    const portoAlegre: CitySearchResult = {
      name: 'Porto Alegre',
      country: 'BR',
      state: 'Rio Grande do Sul',
      lat: -30.0346,
      lon: -51.2177
    };
    handleCitySelect(portoAlegre);
  }, [handleCitySelect]);

  useEffect(() => {
    initialLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    error: weatherError,
    weatherData,
    airQualityData,
    hourlyForecast,
    dailyForecast,
    alerts,
    onCitySelect: handleCitySelect,
    onGeolocate: fetchUserLocationWeather,
    onRetry: initialLoad, // Retry loads the default city
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen font-sans flex flex-col h-screen overflow-hidden">
      <Header activeView={view} setView={setView} />

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