

import React, { useState, useEffect, useCallback } from 'react';
import type { ChatMessage, ChatSession } from '../../types';
import ChatHistory from './ChatHistory';
import ChatInput from './ChatInput';
import AiWelcome from './AiWelcome';
import ChatHistoryManager from './ChatHistoryManager';
import { useTheme } from '../context/ThemeContext';
import { 
    loadCurrentSession, 
    saveCurrentSession, 
    addMessageToSession,
    createNewSession,
    extractChatTitle
} from '../../services/chatHistoryService';
import { HistoryIcon } from '../icons';

interface AiViewProps {
    messages: ChatMessage[];
    onSendMessage: (text: string, isContinuation?: boolean) => void;
    isSending: boolean;
    isListening: boolean;
    onToggleListening: () => void;
    isSearchEnabled: boolean;
    onToggleSearch: () => void;
    chatInputText: string;
    setChatInputText: (text: string) => void;
}

const AiView: React.FC<AiViewProps> = (props) => {
  const { messages, onSendMessage, isSending, ...chatInputProps } = props;
  const { classes } = useTheme();
  
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [hasExtractedTitle, setHasExtractedTitle] = useState(false);

  // Carrega a sessão atual ao montar
  useEffect(() => {
    const saved = loadCurrentSession();
    if (saved) {
      setCurrentSession(saved);
      setHasExtractedTitle(saved.messages.length > 2); // Se já tiver mais de 2 mensagens, título já foi extraído
    } else {
      const newSession = createNewSession();
      setCurrentSession(newSession);
      saveCurrentSession(newSession);
    }
  }, []);

  // Sincroniza mensagens externas com a sessão atual
  useEffect(() => {
    if (currentSession && messages.length > 0) {
      // Verifica se há novas mensagens para adicionar
      const currentIds = new Set(currentSession.messages.map(m => m.id));
      const newMessages = messages.filter(m => !currentIds.has(m.id));
      
      if (newMessages.length > 0) {
        let updatedSession = { ...currentSession };
        
        newMessages.forEach((msg, index) => {
          const isFirstUserMessage = msg.role === 'user' && 
            updatedSession.messages.filter(m => m.role === 'user').length === 0;
          
          updatedSession = addMessageToSession(updatedSession, msg, isFirstUserMessage);
        });
        
        setCurrentSession(updatedSession);
        saveCurrentSession(updatedSession);
      }
    }
  }, [messages]);

  // Extrai título da resposta da IA na primeira mensagem
  useEffect(() => {
    if (hasExtractedTitle || !currentSession) return;
    
    const userMessages = currentSession.messages.filter(m => m.role === 'user');
    const modelMessages = currentSession.messages.filter(m => m.role === 'model');
    
    // Só extrai título se tiver pelo menos 1 mensagem do usuário e 1 da IA
    if (userMessages.length >= 1 && modelMessages.length >= 1) {
      const firstModelMessage = modelMessages[0];
      const { title, cleanResponse } = extractChatTitle(firstModelMessage.text);
      
      if (title) {
        // Atualiza o título da sessão
        const updatedSession = {
          ...currentSession,
          title: title,
          messages: currentSession.messages.map(m => 
            m.id === firstModelMessage.id 
              ? { ...m, text: cleanResponse }
              : m
          )
        };
        setCurrentSession(updatedSession);
        saveCurrentSession(updatedSession);
        
        // Atualiza também a mensagem no componente pai
        const event = new CustomEvent('aiResponseCleaned', { 
          detail: { messageId: firstModelMessage.id, newText: cleanResponse }
        });
        window.dispatchEvent(event);
      }
      
      setHasExtractedTitle(true);
    }
  }, [currentSession?.messages.length, hasExtractedTitle]);

  const handleRegenerate = () => {
      // Find last user message
      const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
      if (lastUserMsg) {
          onSendMessage(lastUserMsg.text, true); // Treat as continuation/retry
      }
  };

  const handleNewSession = useCallback(() => {
    const newSession = createNewSession();
    setCurrentSession(newSession);
    saveCurrentSession(newSession);
    setHasExtractedTitle(false);
    // Limpa mensagens no componente pai via evento
    const event = new CustomEvent('clearChatMessages');
    window.dispatchEvent(event);
  }, []);

  const handleSessionSelect = useCallback((session: ChatSession) => {
    setCurrentSession(session);
    setHasExtractedTitle(session.messages.length > 2);
    // Carrega mensagens da sessão selecionada
    const event = new CustomEvent('loadChatSession', { detail: { messages: session.messages } });
    window.dispatchEvent(event);
  }, []);

  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-col h-full relative">
        {/* Header com botão de histórico */}
        <div className="absolute top-4 right-4 z-10">
            <button
                onClick={() => setIsHistoryOpen(true)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full ${classes.bg}/10 hover:${classes.bg}/20 border border-white/10 text-gray-300 hover:text-white transition-all`}
            >
                <HistoryIcon className="w-4 h-4" />
                <span className="text-sm font-medium hidden sm:inline">Histórico</span>
            </button>
        </div>

        <div className="flex-1 overflow-y-auto lg:pb-24 pb-40 custom-scrollbar">
          {!hasMessages ? (
             <AiWelcome onPromptSelect={(text) => onSendMessage(text, false)} />
          ) : (
             <ChatHistory messages={messages} onRegenerate={handleRegenerate} />
          )}
        </div>
        
        {/* Input Area (Always visible unless on specific conditions, but requested to keep) */}
        <div className="hidden lg:block fixed bottom-4 left-1/2 -translate-x-1/2 w-full max-w-3xl px-4 z-20">
            <div className="bg-gray-900/90 backdrop-blur-xl border border-gray-700/50 p-2 rounded-full shadow-2xl">
                <ChatInput 
                    onSendMessage={(text) => onSendMessage(text, false)} 
                    isSending={isSending}
                    text={chatInputProps.chatInputText}
                    setText={chatInputProps.setChatInputText}
                    isListening={chatInputProps.isListening}
                    onToggleListening={chatInputProps.onToggleListening}
                    isSearchEnabled={chatInputProps.isSearchEnabled}
                    onToggleSearch={chatInputProps.onToggleSearch}
                />
            </div>
            <p className="text-center text-[10px] text-gray-500 mt-2 px-4">
                A IA pode cometer erros. Verifique informações importantes.
            </p>
        </div>

        {/* Chat History Manager Modal */}
        <ChatHistoryManager
            currentSessionId={currentSession?.id || null}
            onSessionSelect={handleSessionSelect}
            onNewSession={handleNewSession}
            isOpen={isHistoryOpen}
            onClose={() => setIsHistoryOpen(false)}
        />
    </div>
  );
};

export default AiView;
