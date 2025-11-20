
import React from 'react';
import type { ChatMessage } from '../../types';
import ChatHistory from './ChatHistory';
import ChatInput from './ChatInput';
import AiWelcome from './AiWelcome';

interface AiViewProps {
    messages: ChatMessage[];
    onSendMessage: (text: string) => void;
    isSending: boolean;
    isListening: boolean;
    onToggleListening: () => void;
    isSearchEnabled: boolean;
    onToggleSearch: () => void;
    chatInputText: string;
    setChatInputText: (text: string) => void;
    userName?: string;
}

const AiView: React.FC<AiViewProps> = (props) => {
  const { messages, onSendMessage, isSending, userName, ...chatInputProps } = props;
  
  // Determine if we are in "Zero State" (only default welcome message or empty)
  // We assume if there is only 1 message and it's the model's generic intro, show welcome screen.
  // BUT, keeping the chat history visible is often better UX. 
  // Let's show Welcome Screen ONLY if messages array is empty OR contains only the generic hardcoded start message AND user hasn't typed yet.
  
  const showWelcome = messages.length <= 1 && messages[0]?.role === 'model' && messages[0]?.text.includes('Olá! Sou a IA');

  return (
    <div className="flex flex-col h-full bg-gray-900">
        <div className="flex-1 overflow-y-auto lg:pb-24 pb-40">
          {showWelcome ? (
              <AiWelcome userName={userName} onSuggestionClick={onSendMessage} />
          ) : (
              <ChatHistory messages={messages} />
          )}
        </div>
        <div className="hidden lg:block fixed bottom-4 left-1/2 -translate-x-1/2 w-full max-w-3xl px-4 z-10">
            <div className="bg-gray-800/80 backdrop-blur-lg border border-gray-700/50 p-2 rounded-full shadow-lg">
                <ChatInput 
                    onSendMessage={onSendMessage} 
                    isSending={isSending}
                    text={chatInputProps.chatInputText}
                    setText={chatInputProps.setChatInputText}
                    isListening={chatInputProps.isListening}
                    onToggleListening={chatInputProps.onToggleListening}
                    isSearchEnabled={chatInputProps.isSearchEnabled}
                    onToggleSearch={chatInputProps.onToggleSearch}
                />
            </div>
            <p className="text-center text-xs text-gray-500 mt-2 px-4">A IA pode cometer erros.</p>
        </div>
    </div>
  );
};

export default AiView;
