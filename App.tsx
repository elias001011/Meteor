import React, { useState, useCallback } from 'react';
import WeatherView from './components/weather/WeatherView';
import AiView from './components/ai/AiView';
import MapView from './components/map/MapView';
import BottomNav from './components/layout/BottomNav';
import Header from './components/layout/Header';
import type { ChatMessage, View } from './types';
import { streamChatResponse } from './services/geminiService';
import DesktopWeather from './components/weather/DesktopWeather';
import PlaceholderView from './components/common/PlaceholderView';
import MobileAiControls from './components/ai/MobileAiControls';
import ErrorPopup from './components/common/ErrorPopup';

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
        {/* --- DESKTOP VIEW (visible on lg screens and up) --- */}
        <div className="hidden lg:block h-full">
          {(view === 'weather' || view === 'map') && (
            <div className="grid grid-cols-2 gap-6 p-6 h-full">
              <div className="overflow-y-auto pr-2 space-y-6">
                <DesktopWeather />
              </div>
              <div className="h-full rounded-3xl overflow-hidden">
                <MapView />
              </div>
            </div>
          )}
          {view === 'ai' && <AiView messages={messages} onSendMessage={handleSendMessage} isSending={isSending} />}
          {view === 'news' && <PlaceholderView title="Notícias" />}
          {view === 'settings' && <PlaceholderView title="Ajustes" />}
          {view === 'tips' && <PlaceholderView title="Dicas" />}
          {view === 'info' && <PlaceholderView title="Informações" />}
        </div>
        
        {/* --- MOBILE VIEW (hidden on lg screens and up) --- */}
        <div className="lg:hidden h-full relative">
          <div className={`${view === 'weather' ? 'block' : 'hidden'} absolute inset-0 overflow-y-auto pb-24`}>
            <WeatherView />
          </div>
          {/* AI view is handled separately to accommodate its custom input controls */}
          <div className={`${view === 'ai' ? 'block' : 'hidden'} h-full`}>
            <AiView messages={messages} onSendMessage={handleSendMessage} isSending={isSending} />
          </div>
          <div className={`${view === 'map' ? 'block' : 'hidden'} absolute inset-0 pb-24`}>
            <MapView />
          </div>
          <div className={`${view === 'news' ? 'block' : 'hidden'} absolute inset-0 overflow-y-auto pb-24`}>
            <PlaceholderView title="Notícias" />
          </div>
           <div className={`${view === 'settings' ? 'block' : 'hidden'} absolute inset-0 overflow-y-auto pb-24`}>
            <PlaceholderView title="Ajustes" />
          </div>
           <div className={`${view === 'tips' ? 'block' : 'hidden'} absolute inset-0 overflow-y-auto pb-24`}>
            <PlaceholderView title="Dicas" />
          </div>
           <div className={`${view === 'info' ? 'block' : 'hidden'} absolute inset-0 overflow-y-auto pb-24`}>
            <PlaceholderView title="Informações" />
          </div>
        </div>

      </main>
      
      {/* --- MOBILE NAVIGATION (hidden on lg screens and up) --- */}
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