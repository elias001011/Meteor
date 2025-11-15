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
        <div className="flex-1 overflow-y-auto lg:pb-4 pb-24">
          <ChatHistory messages={messages} />
        </div>
        <div className="hidden lg:block">
            <ChatInput onSendMessage={onSendMessage} isSending={isSending} />
        </div>
    </div>
  );
};

export default AiView;