
import React from 'react';
import type { ChatMessage } from '../../types';
import ChatHistory from './ChatHistory';
import ChatInput from './ChatInput';
import AiWelcome from './AiWelcome';

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
    userName?: string;
    setMessages?: React.Dispatch<React.SetStateAction<ChatMessage[]>>; // Needed for regeneration
}

const AiView: React.FC<AiViewProps> = (props) => {
  const { messages, onSendMessage, isSending, userName, setMessages, ...chatInputProps } = props;
  
  const showWelcome = messages.length <= 1 && messages[0]?.role === 'model' && messages[0]?.text.includes('Olá! Sou a IA');

  const handleRegenerate = (index: number) => {
      if (!setMessages) return;
      
      // Find the user message that triggered this model response
      // Usually it is the message immediately before, or skipping system messages
      let promptIndex = index - 1;
      while (promptIndex >= 0 && messages[promptIndex].role === 'system') {
          promptIndex--;
      }
      
      if (promptIndex >= 0 && messages[promptIndex].role === 'user') {
          const promptText = messages[promptIndex].text;
          
          // Remove everything from the prompt onwards (delete the bad response and the prompt itself to re-add it properly)
          // Actually, standard practice is to remove just the response and subsequent messages, 
          // but to trigger 'onSendMessage' cleanly, we effectively "undo" to before the prompt
          // However, onSendMessage adds the user message again.
          
          const newHistory = messages.slice(0, promptIndex);
          setMessages(newHistory);
          
          // Re-send
          onSendMessage(promptText, false);
      }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900">
        <div className="flex-1 overflow-y-auto lg:pb-24 pb-40 flex flex-col">
          {showWelcome ? (
              <AiWelcome userName={userName} onSuggestionClick={(text) => onSendMessage(text)} />
          ) : (
              <ChatHistory messages={messages} onRegenerate={setMessages ? handleRegenerate : undefined} />
          )}
        </div>
        <div className="hidden lg:block fixed bottom-4 left-1/2 -translate-x-1/2 w-full max-w-3xl px-4 z-10">
            <div className="bg-gray-800/80 backdrop-blur-lg border border-gray-700/50 p-2 rounded-full shadow-lg">
                <ChatInput 
                    onSendMessage={(text) => onSendMessage(text)} 
                    isSending={isSending}
                    text={chatInputProps.chatInputText}
                    setText={chatInputProps.setChatInputText}
                    isListening={chatInputProps.isListening}
                    onToggleListening={chatInputProps.onToggleListening}
                    isSearchEnabled={chatInputProps.isSearchEnabled}
                    onToggleSearch={chatInputProps.onToggleSearch}
                />
            </div>
            <p className="text-center text-xs text-gray-500 mt-2 px-4">A IA pode cometer erros. Limite de 5 usos/dia.</p>
        </div>
    </div>
  );
};

export default AiView;
