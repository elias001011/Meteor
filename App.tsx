
import React, { useState, useCallback, useEffect, useRef } from 'react';
import WeatherView from './components/weather/WeatherView';
import AiView from './components/ai/AiView';
import MapView from './components/map/MapView';
import BottomNav from './components/layout/BottomNav';
import Header from './components/layout/Header';
import type { ChatMessage, View, CitySearchResult, AllWeatherData, GroundingSource, SearchResultItem, DataSource } from './types';
import { streamChatResponse } from './services/geminiService';
import { getSearchResults } from './services/searchService';
import { fetchAllWeatherData } from './services/weatherService';
import DesktopWeather from './components/weather/DesktopWeather';
import PlaceholderView from './components/common/PlaceholderView';
import MobileAiControls from './components/ai/MobileAiControls';
import { Content } from '@google/genai';
import ErrorPopup from './components/common/ErrorPopup';
import DataSourceModal from './components/common/DataSourceModal';

// Rain animation component defined locally to avoid creating a new file
const RainAnimation: React.FC = () => {
    const numberOfDrops = 50;
    return (
        <div className="fixed top-0 left-0 w-full h-full z-0 pointer-events-none overflow-hidden">
            {Array.from({ length: numberOfDrops }).map((_, i) => (
                <div
                    key={i}
                    className="raindrop"
                    style={{
                        left: `${Math.random() * 100}%`,
                        animationDuration: `${0.5 + Math.random() * 0.5}s`,
                        animationDelay: `${Math.random() * 5}s`,
                    }}
                />
            ))}
        </div>
    );
};


const App: React.FC = () => {
  const [view, setView] = useState<View>('weather');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'model',
      text: 'Olá! Sou a IA do Meteor, sucessora do RS Alerta. Posso ajudar com informações sobre o clima e buscar na web. O que você gostaria de saber?',
    },
  ]);
  const [isSending, setIsSending] = useState(false);
  const [isSearchEnabled, setIsSearchEnabled] = useState(false);
  
  // Speech Recognition state
  const [isListening, setIsListening] = useState(false);
  const [chatInputText, setChatInputText] = useState('');
  const recognitionRef = useRef<any>(null); // Using 'any' for SpeechRecognition to support webkitSpeechRecognition
  const [appError, setAppError] = useState<string | null>(null);


  // Weather state
  const [weatherInfo, setWeatherInfo] = useState<Partial<AllWeatherData>>({});
  const [weatherStatus, setWeatherStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [currentCoords, setCurrentCoords] = useState<{lat: number, lon: number} | null>(null);
  const [currentCityInfo, setCurrentCityInfo] = useState<{name: string, country: string} | null>(null);
  const [isDataSourceModalOpen, setIsDataSourceModalOpen] = useState(false);
  const [preferredDataSource, setPreferredDataSource] = useState<DataSource | 'auto'>('auto');

  const { weatherData, airQualityData, hourlyForecast, dailyForecast, alerts, dataSource, lastUpdated } = weatherInfo;

  // Setup Speech Recognition
  useEffect(() => {
    // FIX: Cast window to `any` to access non-standard `SpeechRecognition` and `webkitSpeechRecognition` properties, resolving TypeScript errors.
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'pt-BR';

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        setChatInputText(finalTranscript + interimTranscript);
      };
      
      recognition.onerror = (event: any) => {
        console.error("Speech Recognition Error", event.error);
        setAppError(`Erro de voz: ${event.error}. Verifique as permissões do microfone.`);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      console.warn("Speech Recognition not supported by this browser.");
    }
  }, []);

  const handleFetchWeather = useCallback(async (coords: { lat: number; lon: number }, cityInfo?: { name: string; country: string }, source: DataSource | 'auto' = 'auto') => {
    setWeatherStatus('loading');
    setWeatherError(null);
    setCurrentCoords(coords);
    if(cityInfo) setCurrentCityInfo(cityInfo);

    try {
      const data = await fetchAllWeatherData(coords.lat, coords.lon, cityInfo, source);
      setWeatherInfo(data);
      setWeatherStatus('success');
      if (data.fallbackStatus) {
        setAppError("Aviso: A fonte de dados principal falhou. Usando uma fonte alternativa. Alguns dados (como alertas) podem não estar disponíveis.");
      }
    } catch (error) {
      console.error("Failed to fetch weather data:", error);
      setWeatherError(error instanceof Error ? error.message : "Um erro desconhecido ocorreu.");
      setWeatherStatus('error');
    }
  }, []);
  
  const handleCitySelect = useCallback((city: CitySearchResult) => {
    handleFetchWeather({ lat: city.lat, lon: city.lon }, { name: city.name, country: city.country }, preferredDataSource);
  }, [handleFetchWeather, preferredDataSource]);

  const fetchUserLocationWeather = useCallback(() => {
    setWeatherStatus('loading');
    setWeatherError(null);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          handleFetchWeather({ lat: position.coords.latitude, lon: position.coords.longitude }, undefined, preferredDataSource);
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
  }, [handleFetchWeather, preferredDataSource]);

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

  const handleDataSourceChange = useCallback((newSource: DataSource | 'auto') => {
      setPreferredDataSource(newSource);
      setIsDataSourceModalOpen(false);
      if (currentCoords) {
          handleFetchWeather(currentCoords, currentCityInfo || undefined, newSource);
      }
  }, [currentCoords, currentCityInfo, handleFetchWeather]);

  const sendQueryToModel = useCallback(async (query: string, searchResults: SearchResultItem[] | null) => {
    setIsSending(true);

    const modelMessage: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text: '', sources: [] };
    setMessages(prev => [...prev, modelMessage]);
    
    const history: Content[] = messages.slice(1).map(msg => ({ // Exclude initial system message
        role: msg.role,
        parts: [{ text: msg.text }]
    }));

    const stream = streamChatResponse(query, history, weatherInfo, searchResults);
    let fullText = '';
    const allSources: GroundingSource[] = [];

    if (searchResults) {
        searchResults.forEach(result => {
            if (!allSources.some(s => s.uri === result.link)) {
                allSources.push({ uri: result.link, title: result.title });
            }
        });
    }

    for await (const chunk of stream) {
        fullText += chunk.text;

        setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage.role === 'model') {
                lastMessage.text = fullText;
                lastMessage.sources = [...allSources];
            }
            return newMessages;
        });
    }

    setIsSending(false);
  }, [messages, weatherInfo]);
  
  const handleSendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;
    const userMessage: ChatMessage = { id: Date.now().toString(), role: 'user', text };
    setMessages(prev => [...prev, userMessage]);
    
    let searchResults: SearchResultItem[] | null = null;
    if (isSearchEnabled) {
      setIsSending(true); // Show loading while searching
      searchResults = await getSearchResults(text);
      setIsSending(false);
    }

    sendQueryToModel(text, searchResults);
  }, [sendQueryToModel, isSearchEnabled]);

  const handleToggleListening = useCallback(() => {
    if (!recognitionRef.current) {
        setAppError("O reconhecimento de voz não é suportado neste navegador.");
        return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setChatInputText('');
      recognitionRef.current.start();
    }
    setIsListening(prev => !prev);
  }, [isListening]);

  const weatherProps = {
    status: weatherStatus,
    error: weatherError,
    weatherData, airQualityData, hourlyForecast, dailyForecast, alerts, dataSource, lastUpdated,
    onCitySelect: handleCitySelect,
    onGeolocate: fetchUserLocationWeather,
    onRetry: () => {
        if (currentCoords) {
            handleFetchWeather(currentCoords, currentCityInfo || undefined, preferredDataSource)
        } else {
            initialLoad();
        }
    },
    onDataSourceInfoClick: () => setIsDataSourceModalOpen(true),
  };
  
  const aiViewProps = {
      messages, onSendMessage: handleSendMessage, isSending,
      chatInputText, setChatInputText,
      isListening, onToggleListening: handleToggleListening,
      isSearchEnabled, onToggleSearch: () => setIsSearchEnabled(prev => !prev)
  };

  const isRaining = weatherData?.condition?.toLowerCase().includes('chuv');


  return (
    <div className="relative bg-gray-900 text-white min-h-screen font-sans flex flex-col h-screen overflow-hidden">
      {view === 'weather' && isRaining && <RainAnimation />}
      <Header activeView={view} setView={setView} />
      {appError && <ErrorPopup message={appError} onClose={() => setAppError(null)} />}
      
      <DataSourceModal 
        isOpen={isDataSourceModalOpen}
        onClose={() => setIsDataSourceModalOpen(false)}
        currentSource={dataSource}
        preferredSource={preferredDataSource}
        onSourceChange={handleDataSourceChange}
      />

      <main className="relative z-10 flex-1 pt-16 overflow-hidden">
        {/* --- DESKTOP VIEW --- */}
        <div className="hidden lg:block h-full">
          {view === 'weather' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 h-full">
              <div className="overflow-y-auto pr-2 space-y-6">
                <DesktopWeather {...weatherProps} />
              </div>
              <div className="h-full rounded-3xl overflow-hidden">
                {currentCoords && <MapView lat={currentCoords.lat} lon={currentCoords.lon} />}
              </div>
            </div>
          )}
          {view === 'ai' && <AiView {...aiViewProps} />}
          {view === 'map' && currentCoords && <MapView lat={currentCoords.lat} lon={currentCoords.lon} />}
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
            <AiView {...aiViewProps} />
          </div>
          <div className={`${view === 'map' ? 'block' : 'hidden'} h-full pb-24`}>
             {currentCoords && <MapView lat={currentCoords.lat} lon={currentCoords.lon} />}
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
            {...aiViewProps}
        />
      </div>
    </div>
  );
};

export default App;
