import React from 'react';
import type { ChatMessage } from '../../types';
import ChatHistory from './ChatHistory';
import ChatInput from './ChatInput';

interface AiViewProps {
    messages: ChatMessage[];
    onSendMessage: (text: string) => void;
    isSending: boolean;
}

const AiView: React.FC<AiViewProps> = ({ messages, onSendMessage, isSending }) => {
  return (
    <div className="flex flex-col h-full bg-gray-900">
        <div className="flex-1 overflow-y-auto lg:pb-24 pb-24">
          <ChatHistory messages={messages} />
        </div>
        <div className="hidden lg:block fixed bottom-4 left-1/2 -translate-x-1/2 w-full max-w-3xl px-4 z-10">
            <div className="bg-gray-800/80 backdrop-blur-lg border border-gray-700/50 p-2 rounded-full shadow-lg">
                <ChatInput onSendMessage={onSendMessage} isSending={isSending} />
            </div>
        </div>
    </div>
  );
};

export default AiView;