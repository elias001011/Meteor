
import React, { useState, useCallback, useEffect, useRef } from 'react';
import WeatherView from './components/weather/WeatherView';
import AiView from './components/ai/AiView';
import MapView from './components/map/MapView';
import NewsView from './components/news/NewsView';
import BottomNav from './components/layout/BottomNav';
import Header from './components/layout/Header';
import type { ChatMessage, View, CitySearchResult, AllWeatherData, GroundingSource, SearchResultItem, DataSource, AppSettings, AppTheme } from './types';
import { streamChatResponse } from './services/geminiService';
import { getSearchResults } from './services/searchService';
import { fetchAllWeatherData } from './services/weatherService';
import { getSettings, saveSettings, importAppData } from './services/settingsService';
import DesktopWeather from './components/weather/DesktopWeather';
import PlaceholderView from './components/common/PlaceholderView';
import MobileAiControls from './components/ai/MobileAiControls';
import SettingsView from './components/settings/SettingsView';
import { Content } from '@google/genai';
import ErrorPopup from './components/common/ErrorPopup';
import DataSourceModal from './components/common/DataSourceModal';
import ImportModal from './components/settings/ImportModal';
import ChangelogModal from './components/settings/ChangelogModal';
import CitySelectionModal from './components/common/CitySelectionModal';
import OnboardingModal from './components/common/OnboardingModal';
import { ThemeProvider, useTheme } from './components/context/ThemeContext';
import ZenMode from './components/weather/ZenMode';

// Rain animation component defined locally
const RainAnimation: React.FC<{ intensity: 'low' | 'high' }> = ({ intensity }) => {
    // RECALIBRATED LOGIC v4.2: High = 100 drops, Low = 50.
    const numberOfDrops = intensity === 'high' ? 100 : 50;
    
    return (
        <div className="fixed inset-0 w-full h-full z-0 pointer-events-none overflow-hidden">
            {Array.from({ length: numberOfDrops }).map((_, i) => {
                const delay = Math.random() * -5;
                const duration = (0.4 + Math.random() * 0.4);
                
                // Reduced opacity: Low starts at 0.05. High starts at 0.1
                const baseOpacity = intensity === 'high' ? 0.1 : 0.05;
                const randomOpacity = Math.random() * (intensity === 'high' ? 0.2 : 0.15);
                
                return (
                    <div
                        key={i}
                        className="raindrop"
                        style={{
                            left: `${Math.random() * 100}%`,
                            animationDuration: `${duration}s`,
                            animationDelay: `${delay}s`,
                            opacity: baseOpacity + randomOpacity, 
                            background: 'linear-gradient(to bottom, rgba(56, 189, 248, 0) 0%, rgba(186, 230, 253, 0.6) 100%)',
                            width: '1px', 
                            height: `${Math.random() * 100 + 100}px`
                        }}
                    />
                );
            })}
        </div>
    );
};

// Separate component to access theme context
const AppContent: React.FC<{
    settings: AppSettings;
    handleSettingsChange: (s: AppSettings) => void;
    handleClearChatHistory: () => void;
    view: View;
    setView: (v: View) => void;
    messages: ChatMessage[];
    isSending: boolean;
    chatInputText: string;
    setChatInputText: (t: string) => void;
    isListening: boolean;
    onToggleListening: () => void;
    isSearchEnabled: boolean;
    onToggleSearch: () => void;
    handleSendMessage: (t: string, c?: boolean) => void;
    weatherInfo: Partial<AllWeatherData>;
    weatherStatus: 'idle' | 'loading' | 'success' | 'error';
    weatherError: string | null;
    currentCoords: { lat: number; lon: number } | null;
    currentCityInfo: { name: string; country: string } | null;
    preferredDataSource: DataSource | 'auto';
    handleFetchWeather: (coords: { lat: number; lon: number }, cityInfo?: { name: string; country: string }, source?: DataSource | 'auto') => void;
    handleCitySelect: (city: CitySearchResult) => void;
    fetchUserLocationWeather: () => void;
    dataSource: DataSource | undefined;
    lastUpdated: number | undefined;
    handleDataSourceChange: (s: DataSource | 'auto') => void;
    isDataSourceModalOpen: boolean;
    setIsDataSourceModalOpen: (o: boolean) => void;
    appError: string | null;
    setAppError: (e: string | null) => void;
    onOpenImport: () => void;
    onOpenChangelog: () => void;
    onOpenSettingsCity: () => void;
    toggleZenMode: () => void;
    isZenMode: boolean;
    handleNewsAskAI?: (newsContext: string) => void;
}> = (props) => {
    const { appBackgroundClass, isPerformanceMode } = useTheme();
    const { settings, view, weatherInfo, weatherStatus, appError } = props;
    
    const condition = weatherInfo.weatherData?.condition?.toLowerCase() || '';
    const isRaining = condition.includes('chuv') || 
                      condition.includes('rain') || 
                      condition.includes('drizzle') || 
                      condition.includes('garoa') || 
                      condition.includes('tempestade') || 
                      condition.includes('trovoada') ||
                      condition.includes('aguaceiro');

    const weatherProps = {
        status: weatherStatus,
        error: props.weatherError,
        weatherData: weatherInfo.weatherData,
        airQualityData: weatherInfo.airQualityData,
        hourlyForecast: weatherInfo.hourlyForecast || [],
        dailyForecast: weatherInfo.dailyForecast || [],
        alerts: weatherInfo.alerts || [],
        dataSource: weatherInfo.dataSource,
        lastUpdated: weatherInfo.lastUpdated,
        clockDisplayMode: settings.clockDisplayMode,
        unitSystem: settings.unitSystem, // Pass unit system down for reactivity
        showDetailLabel: settings.showDetailLabel, // Pass detail label toggle
        onCitySelect: props.handleCitySelect,
        onGeolocate: props.fetchUserLocationWeather,
        onRetry: () => {
            if (props.currentCoords) {
                props.handleFetchWeather(props.currentCoords, props.currentCityInfo || undefined, props.preferredDataSource)
            }
        },
        onDataSourceInfoClick: () => props.setIsDataSourceModalOpen(true),
    };

    const aiViewProps = {
        messages: props.messages,
        onSendMessage: (text: string, isContinuation?: boolean) => props.handleSendMessage(text, isContinuation),
        isSending: props.isSending,
        chatInputText: props.chatInputText,
        setChatInputText: props.setChatInputText,
        isListening: props.isListening,
        onToggleListening: props.onToggleListening,
        isSearchEnabled: props.isSearchEnabled,
        onToggleSearch: props.onToggleSearch
    };
    
    // Performance Mode Overrides for Animation
    const animationClass = (settings.reducedMotion || isPerformanceMode) ? '' : 'animate-enter';
    
    // Performance Mode Logic for Rain: 
    // If Performance Mode is ON: Force rain to 'low' if it was enabled.
    // If Settings say disabled, keep disabled.
    const showRain = settings.rainAnimation.enabled && isRaining;
    const rainIntensity = isPerformanceMode ? 'low' : settings.rainAnimation.intensity;

    const getDesktopGrid = () => {
        const layout = settings.desktopLayout || '40-60';
        switch (layout) {
            case '25-75': return { left: 'lg:col-span-3', right: 'lg:col-span-9' };
            case '50-50': return { left: 'lg:col-span-6', right: 'lg:col-span-6' };
            case '40-60': default: return { left: 'lg:col-span-5', right: 'lg:col-span-7' };
        }
    };
    
    const gridCols = getDesktopGrid();

    return (
        <div className={`relative text-white min-h-screen font-sans flex flex-col h-screen overflow-hidden transition-colors duration-500 ${appBackgroundClass}`}>
            
            {/* Zen Mode Overlay */}
            {props.isZenMode && weatherInfo.weatherData && (
                <ZenMode data={weatherInfo.weatherData} onExit={props.toggleZenMode} />
            )}
            
            {view === 'weather' && showRain && !props.isZenMode && (
                <RainAnimation intensity={rainIntensity} />
            )}

            <Header 
                activeView={view} 
                setView={props.setView} 
                showClock={settings.showClock} 
                borderEffect={settings.borderEffect}
                onToggleZenMode={props.toggleZenMode}
            />
            
            {appError && <ErrorPopup message={appError} onClose={() => props.setAppError(null)} />}

            <DataSourceModal
                isOpen={props.isDataSourceModalOpen}
                onClose={() => props.setIsDataSourceModalOpen(false)}
                currentSource={props.dataSource || null}
                preferredSource={props.preferredDataSource}
                onSourceChange={props.handleDataSourceChange}
            />

            <main className="relative z-10 flex-1 h-full overflow-hidden">
                <div className="hidden lg:block h-full overflow-y-auto pt-16">
                    {view === 'weather' && (
                        <div className={`grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 h-full ${animationClass}`}>
                            <div className={`${gridCols.left} overflow-y-auto pr-2 space-y-6`}>
                                <DesktopWeather {...weatherProps} />
                            </div>
                            <div className={`${gridCols.right} h-full rounded-3xl overflow-hidden shadow-2xl border border-white/10`}>
                                <MapView key={settings.desktopLayout} lat={props.currentCoords?.lat} lon={props.currentCoords?.lon} theme={settings.mapTheme} />
                            </div>
                        </div>
                    )}
                    {view === 'ai' && <div className={`h-full ${animationClass}`}><AiView {...aiViewProps} /></div>}
                    {view === 'map' && <div className={`h-full ${animationClass}`}><MapView lat={props.currentCoords?.lat} lon={props.currentCoords?.lon} theme={settings.mapTheme} /></div>}
                    {view === 'news' && (
                        <div className={`h-full overflow-hidden ${animationClass}`}>
                            <NewsView onAskAIAboutNews={props.handleNewsAskAI} />
                        </div>
                    )}
                    {view === 'settings' && <div className={animationClass}>
                        <SettingsView 
                            settings={settings} 
                            onSettingsChanged={props.handleSettingsChange} 
                            onClearHistory={props.handleClearChatHistory} 
                            onOpenImport={props.onOpenImport}
                            onOpenChangelog={props.onOpenChangelog}
                            onOpenCitySelection={props.onOpenSettingsCity}
                        />
                    </div>}
                    {view === 'tips' && <div className={animationClass}><PlaceholderView title="Dicas" /></div>}
                    {view === 'info' && <div className={animationClass}><PlaceholderView title="Informações" /></div>}
                </div>

                <div className="lg:hidden h-full">
                    <div className={`${view === 'weather' ? 'block' : 'hidden'} h-full overflow-y-auto pb-24 pt-16 ${animationClass}`}>
                        <WeatherView {...weatherProps} />
                    </div>
                    <div className={`${view === 'ai' ? 'block' : 'hidden'} h-full pt-16 ${animationClass}`}>
                        <AiView {...aiViewProps} />
                    </div>
                    <div className={`${view === 'map' ? 'block' : 'hidden'} h-full pb-24 pt-16 ${animationClass}`}>
                        <MapView lat={props.currentCoords?.lat} lon={props.currentCoords?.lon} theme={settings.mapTheme} />
                    </div>
                    <div className={`${view === 'news' ? 'block' : 'hidden'} h-full overflow-hidden pb-24 pt-16 ${animationClass}`}>
                        <NewsView onAskAIAboutNews={props.handleNewsAskAI} />
                    </div>
                    <div className={`${view === 'settings' ? 'block' : 'hidden'} h-full overflow-y-auto pb-24 pt-16 ${animationClass}`}>
                        <SettingsView 
                            settings={settings} 
                            onSettingsChanged={props.handleSettingsChange} 
                            onClearHistory={props.handleClearChatHistory}
                            onOpenImport={props.onOpenImport}
                            onOpenChangelog={props.onOpenChangelog}
                            onOpenCitySelection={props.onOpenSettingsCity}
                        />
                    </div>
                    <div className={`${view === 'tips' ? 'block' : 'hidden'} h-full overflow-y-auto pb-24 pt-16 ${animationClass}`}>
                        <PlaceholderView title="Dicas" />
                    </div>
                    <div className={`${view === 'info' ? 'block' : 'hidden'} h-full overflow-y-auto pb-24 pt-16 ${animationClass}`}>
                        <PlaceholderView title="Informações" />
                    </div>
                </div>
            </main>

            <div className="lg:hidden">
                <BottomNav 
                    activeView={view} 
                    setView={props.setView} 
                    onToggleZenMode={props.toggleZenMode}
                />
                <MobileAiControls
                    isVisible={view === 'ai'}
                    onSendMessage={(text) => props.handleSendMessage(text, false)}
                    isSending={props.isSending}
                    {...aiViewProps}
                />
            </div>
        </div>
    );
}

const App: React.FC = () => {
  const [view, setView] = useState<View>('weather');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isSearchEnabled, setIsSearchEnabled] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  
  const [isListening, setIsListening] = useState(false);
  const [chatInputText, setChatInputText] = useState('');
  const recognitionRef = useRef<any>(null); 
  const [appError, setAppError] = useState<string | null>(null);

  const [settings, setSettings] = useState<AppSettings>(getSettings());

  const [weatherInfo, setWeatherInfo] = useState<Partial<AllWeatherData>>({});
  const [weatherStatus, setWeatherStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [currentCoords, setCurrentCoords] = useState<{lat: number, lon: number} | null>(null);
  const [currentCityInfo, setCurrentCityInfo] = useState<{name: string, country: string} | null>(null);
  const [isDataSourceModalOpen, setIsDataSourceModalOpen] = useState(false);
  
  const [showImportModal, setShowImportModal] = useState(false);
  const [showChangelogModal, setShowChangelogModal] = useState(false);
  const [showSettingsCityModal, setShowSettingsCityModal] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);

  const [preferredDataSource, setPreferredDataSource] = useState<DataSource | 'auto'>('auto');
  
  const [activeTheme, setActiveTheme] = useState<AppTheme>(settings.themeColor);

  const { weatherData, dataSource, lastUpdated } = weatherInfo;

  useEffect(() => {
    if (settings.showScrollbars) {
        document.documentElement.classList.add('show-scrollbars');
    } else {
        document.documentElement.classList.remove('show-scrollbars');
    }
  }, [settings.showScrollbars]);

  useEffect(() => {
    if (settings.saveChatHistory) {
        const savedHistory = localStorage.getItem('chat_history');
        if (savedHistory) {
            try {
                const parsed = JSON.parse(savedHistory);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setMessages(parsed);
                }
            } catch (e) {
                console.error("Failed to load chat history", e);
            }
        }
    }
  }, []);

  useEffect(() => {
    if (settings.saveChatHistory) {
        if (messages.length > 0) {
             localStorage.setItem('chat_history', JSON.stringify(messages));
        }
    } else {
        localStorage.removeItem('chat_history');
    }
  }, [messages, settings.saveChatHistory]);
  
  useEffect(() => {
      const hasSeenIntro = localStorage.getItem('meteor_intro_seen');
      if (!hasSeenIntro) {
          setShowOnboardingModal(true);
      }
  }, []);

  const handleOnboardingClose = () => {
      localStorage.setItem('meteor_intro_seen', 'true');
      setShowOnboardingModal(false);
  };

  const handleSettingsChange = (newSettings: AppSettings) => {
    saveSettings(newSettings); 
    setSettings(newSettings); 
  };
  
  const handleClearChatHistory = useCallback(() => {
      setMessages([]);
      localStorage.removeItem('chat_history');
  }, []);

  const handleImportData = (content: string, options: any) => {
      const success = importAppData(content, options);
      if (success) {
          setAppError("Dados importados com sucesso! Recarregando...");
          setTimeout(() => window.location.reload(), 1500);
      } else {
          setAppError("Falha ao importar arquivo.");
      }
      setShowImportModal(false);
  };

  useEffect(() => {
      if (!settings.dynamicTheme) {
          setActiveTheme(settings.themeColor);
          return;
      }
      if (!weatherData) {
          setActiveTheme(settings.themeColor);
          return;
      }

      const now = Date.now() / 1000;
      const isNight = now < weatherData.sunrise || now > weatherData.sunset;

      if (isNight) {
          setActiveTheme('purple');
      } else {
          const condition = weatherData.condition?.toLowerCase() || '';
          const icon = weatherData.conditionIcon || '';

          if (condition.includes('chuv') || condition.includes('rain') || condition.includes('drizzle') || condition.includes('trov')) {
              setActiveTheme('blue');
          } else if (condition.includes('limpo') || condition.includes('clear') || condition.includes('sol') || icon === '☀️') {
              setActiveTheme('amber');
          } else if (condition.includes('nublado') || condition.includes('cloud') || condition.includes('nevo') || condition.includes('mist')) {
              setActiveTheme('emerald');
          } else {
              setActiveTheme('cyan');
          }
      }
  }, [settings.dynamicTheme, settings.themeColor, weatherData, settings.performanceMode]);

  useEffect(() => {
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
          metaThemeColor.setAttribute('content', '#0f172a');
      }
  }, [settings.performanceMode]);

  useEffect(() => {
      const initApp = () => {
          const savedSettings = getSettings();
          setSettings(savedSettings);
          setPreferredDataSource(savedSettings.weatherSource);

          if (savedSettings.startFullscreen) {
             const enterFullscreen = async () => {
                 if (!document.fullscreenElement) {
                     try {
                        await document.documentElement.requestFullscreen();
                        window.removeEventListener('click', enterFullscreen);
                        window.removeEventListener('touchend', enterFullscreen);
                        window.removeEventListener('keydown', enterFullscreen);
                     } catch (e) {
                        console.log("Auto-fullscreen deferred.", e);
                     }
                 }
             };
             window.addEventListener('click', enterFullscreen);
             window.addEventListener('touchend', enterFullscreen);
             window.addEventListener('keydown', enterFullscreen);
          }

          if (savedSettings.startupBehavior === 'custom_section' && savedSettings.startupSection) {
              setView(savedSettings.startupSection);
          } else if (savedSettings.startupBehavior === 'specific_location' && savedSettings.specificLocation) {
               handleFetchWeather(
                   { lat: savedSettings.specificLocation.lat, lon: savedSettings.specificLocation.lon },
                   { name: savedSettings.specificLocation.name, country: savedSettings.specificLocation.country },
                   savedSettings.weatherSource
               );
          } else if (savedSettings.startupBehavior === 'last_location') {
               const lastCoordsStr = localStorage.getItem('last_coords');
               if (lastCoordsStr) {
                   try {
                       const coords = JSON.parse(lastCoordsStr);
                       handleFetchWeather(coords, undefined, savedSettings.weatherSource);
                   } catch (e) {
                       console.error("Failed to parse last location", e);
                   }
               }
          }
      };
      initApp();
  }, []);

  useEffect(() => {
      setPreferredDataSource(settings.weatherSource);
      if (currentCoords && settings.weatherSource !== dataSource && weatherStatus === 'success') {
          handleFetchWeather(currentCoords, currentCityInfo || undefined, settings.weatherSource);
      }
  }, [settings.weatherSource]);


  useEffect(() => {
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
        setAppError(`Erro de voz: ${event.error}`);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const handleFetchWeather = useCallback(async (coords: { lat: number; lon: number }, cityInfo?: { name: string; country: string }, source: DataSource | 'auto' = 'auto') => {
    setWeatherStatus('loading');
    setWeatherError(null);
    setCurrentCoords(coords);
    if(cityInfo) setCurrentCityInfo(cityInfo);

    localStorage.setItem('last_coords', JSON.stringify(coords));

    try {
      const data = await fetchAllWeatherData(coords.lat, coords.lon, cityInfo, source);
      setWeatherInfo(data);
      setWeatherStatus('success');
      if (data.fallbackStatus) {
        setAppError("Aviso: A fonte de dados principal falhou. Usando uma fonte alternativa.");
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
          setWeatherError("Não foi possível obter sua localização.");
          setWeatherStatus('error');
        }
      );
    } else {
      setWeatherError("Geolocalização não é suportada.");
      setWeatherStatus('error');
    }
  }, [handleFetchWeather, preferredDataSource]);

  const handleDataSourceChange = useCallback((newSource: DataSource | 'auto') => {
      setPreferredDataSource(newSource);
      setIsDataSourceModalOpen(false);
      if (currentCoords) {
          handleFetchWeather(currentCoords, currentCityInfo || undefined, newSource);
      }
  }, [currentCoords, currentCityInfo, handleFetchWeather]);

  const sendQueryToModel = useCallback(async (query: string, initialSearchResults: SearchResultItem[] | null) => {
    setIsSending(true);

    const modelMessage: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text: '', sources: [] };
    setMessages(prev => [...prev, modelMessage]);
    
    const history: Content[] = messages.map(msg => ({ 
        role: msg.role,
        parts: [{ text: msg.text }]
    }));

    const timeContext = new Date().toLocaleString('pt-BR', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });

    const performChatRequest = async (searchData: SearchResultItem[] | null) => {
        const stream = streamChatResponse(query, history, weatherInfo, searchData, timeContext, isSearchEnabled);
        let fullText = '';
        const allSources: GroundingSource[] = [];

        if (searchData) {
            searchData.forEach(result => {
                if (!allSources.some(s => s.uri === result.link)) {
                    allSources.push({ uri: result.link, title: result.title });
                }
            });
        }

        try {
            for await (const chunk of stream) {
                fullText = chunk.text;
                
                setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMessage = newMessages[newMessages.length - 1];
                    if (lastMessage.role === 'model') {
                        lastMessage.text = fullText;
                        lastMessage.sources = [...allSources];
                        if (chunk.isFinal) {
                            lastMessage.modelUsed = chunk.model;
                            lastMessage.processingTime = chunk.processingTime;
                            lastMessage.toolExecuted = chunk.toolUsed;
                        }
                    }
                    return newMessages;
                });
            }
        } catch (e) {
            console.error("Error in chat stream", e);
             setMessages(prev => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage.role === 'model') {
                    lastMessage.text += "\n\n[Erro ao processar resposta]";
                }
                return newMessages;
            });
        }
    };

    await performChatRequest(initialSearchResults);
    setIsSending(false);
  }, [messages, weatherInfo, isSearchEnabled]);
  
  const handleSendMessage = useCallback(async (text: string, isContinuation: boolean = false) => {
    if (!text.trim()) return;

    if (!isContinuation) {
        const userMessage: ChatMessage = { id: Date.now().toString(), role: 'user', text };
        setMessages(prev => [...prev, userMessage]);
    }
    
    let searchResults: SearchResultItem[] | null = null;
    
    if (isSearchEnabled) {
      setIsSending(true); 
       try {
        const dateQuery = `${text} ${new Date().toLocaleDateString('pt-BR')}`;
        searchResults = await getSearchResults(dateQuery);
      } catch (e) {
        console.error("Web search failed:", e);
      }
      setIsSending(false);
    }
    
    sendQueryToModel(text, searchResults);
  }, [isSearchEnabled, sendQueryToModel]);


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

  const handleToggleSearch = () => {
    setIsSearchEnabled(prev => !prev);
  };
  
  const toggleZenMode = () => {
      if (!weatherInfo.weatherData && !isZenMode) {
          setAppError("Aguarde os dados do clima carregarem para entrar no modo Zen.");
          return;
      }
      setIsZenMode(prev => !prev);
  }

  // Handler para perguntar à IA sobre uma notícia
  const handleNewsAskAI = useCallback((newsContext: string) => {
      // Mudar para a aba de IA
      setView('ai');
      
      // Criar a mensagem do usuário com o contexto da notícia
      const userMessage = `Analise esta notícia para mim:\n\n${newsContext}\n\nPor favor, forneça um resumo objetivo e seus insights sobre o assunto.`;
      
      // Enviar a mensagem para a IA
      setTimeout(() => {
          handleSendMessage(userMessage, false);
      }, 300);
  }, [handleSendMessage]);

  return (
    <ThemeProvider 
      theme={activeTheme} 
      transparencyMode={settings.transparencyMode} 
      glassScope={settings.glassScope}
      backgroundMode={settings.backgroundMode} 
      performanceMode={settings.performanceMode}
      reducedMotion={settings.reducedMotion}
      layoutDensity={settings.layoutDensity}
    >
      <AppContent 
        settings={settings}
        handleSettingsChange={handleSettingsChange}
        handleClearChatHistory={handleClearChatHistory}
        view={view}
        setView={setView}
        messages={messages}
        isSending={isSending}
        chatInputText={chatInputText}
        setChatInputText={setChatInputText}
        isListening={isListening}
        onToggleListening={handleToggleListening}
        isSearchEnabled={isSearchEnabled}
        onToggleSearch={handleToggleSearch}
        handleSendMessage={handleSendMessage}
        weatherInfo={weatherInfo}
        weatherStatus={weatherStatus}
        weatherError={weatherError}
        currentCoords={currentCoords}
        currentCityInfo={currentCityInfo}
        preferredDataSource={preferredDataSource}
        handleFetchWeather={handleFetchWeather}
        handleCitySelect={handleCitySelect}
        fetchUserLocationWeather={fetchUserLocationWeather}
        dataSource={dataSource}
        lastUpdated={lastUpdated}
        handleDataSourceChange={handleDataSourceChange}
        isDataSourceModalOpen={isDataSourceModalOpen}
        setIsDataSourceModalOpen={setIsDataSourceModalOpen}
        appError={appError}
        setAppError={setAppError}
        onOpenImport={() => setShowImportModal(true)}
        onOpenChangelog={() => setShowChangelogModal(true)}
        onOpenSettingsCity={() => setShowSettingsCityModal(true)}
        toggleZenMode={toggleZenMode}
        isZenMode={isZenMode}
        handleNewsAskAI={handleNewsAskAI}
      />
      
      {showOnboardingModal && <OnboardingModal onClose={handleOnboardingClose} />}
      <ImportModal isOpen={showImportModal} onClose={() => setShowImportModal(false)} onImport={handleImportData} />
      <ChangelogModal isOpen={showChangelogModal} onClose={() => setShowChangelogModal(false)} />
      <CitySelectionModal 
          isOpen={showSettingsCityModal}
          onClose={() => {
              setShowSettingsCityModal(false);
              if (!settings.specificLocation) setAppError("Nenhuma localização selecionada.");
          }}
          onSelect={(city) => {
              handleSettingsChange({ ...settings, specificLocation: city });
              setShowSettingsCityModal(false);
          }}
      />
    </ThemeProvider>
  );
};

export default App;
