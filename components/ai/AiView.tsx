

import React, { useRef, useEffect } from 'react';
import type { ChatMessage } from '../../types';
import ChatHistory from './ChatHistory';
import ChatInput from './ChatInput';
import AiWelcome from './AiWelcome';
import { useTheme } from '../context/ThemeContext';

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
  
  const handleRegenerate = () => {
      // Find last user message
      const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
      if (lastUserMsg) {
          onSendMessage(lastUserMsg.text, true); // Treat as continuation/retry
      }
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-col h-full relative">
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
    </div>
  );
};

export default AiView;