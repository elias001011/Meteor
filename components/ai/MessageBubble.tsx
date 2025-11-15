
import React from 'react';
import type { ChatMessage } from '../../types';
import { SparklesIcon } from '../icons';

interface MessageBubbleProps {
  message: ChatMessage;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isModel = message.role === 'model';
  return (
    <div className={`flex items-end gap-2 ${isModel ? 'justify-start' : 'justify-end'}`}>
      {isModel && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center">
            <SparklesIcon className="w-5 h-5 text-white" />
        </div>
      )}
      <div
        className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-2xl ${
          isModel
            ? 'bg-gray-700 rounded-bl-none'
            : 'bg-blue-600 text-white rounded-br-none'
        }`}
      >
        <p className="text-base whitespace-pre-wrap">{message.text}{!isModel && message.text.length === 0 ? '...' : ''}</p>
      </div>
    </div>
  );
};

export default MessageBubble;
