

import React from 'react';
import type { ChatMessage } from '../../types';
import { LinkIcon } from '../icons';
import { useTheme } from '../context/ThemeContext';

interface MessageBubbleProps {
  message: ChatMessage;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isModel = message.role === 'model';
  const { classes } = useTheme();

  // Simple formatter for **bold** and *italic* text from the model
  const renderFormattedText = (text: string) => {
    // This regex will find **bold** and *italic* text
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={index}>{part.substring(2, part.length - 2)}</strong>;
        }
        if (part.startsWith('*') && part.endsWith('*')) {
            return <em key={index}>{part.substring(1, part.length - 1)}</em>;
        }
        return part;
    });
  };

  return (
    <div className={`flex items-end ${isModel ? 'justify-start' : 'justify-end'}`}>
      <div className="flex flex-col">
        <div
          className={`max-w-xl md:max-w-2xl px-4 py-3 rounded-2xl ${
            isModel
              ? 'bg-gray-700 rounded-bl-none'
              : `${classes.bg} text-white rounded-br-none`
          }`}
        >
          <div className="text-base whitespace-pre-wrap">
            {isModel ? renderFormattedText(message.text) : message.text}
            {!isModel && message.text.length === 0 ? '...' : ''}
          </div>
        </div>

        {message.sources && message.sources.length > 0 && (
          <div className="mt-2 max-w-xs md:max-w-md lg:max-w-lg">
            <h4 className="text-xs text-gray-400 font-semibold mb-1">Fontes:</h4>
            <div className="flex flex-col gap-1.5">
              {message.sources.map((source, index) => (
                <a 
                  key={index} 
                  href={source.uri} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className={`text-sm ${classes.text} bg-gray-700/50 hover:bg-gray-700 p-2 rounded-lg flex items-center gap-2 truncate`}
                >
                  <LinkIcon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{source.title || new URL(source.uri).hostname}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;