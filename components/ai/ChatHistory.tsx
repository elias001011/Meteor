

import React, { useRef, useEffect } from 'react';
import type { ChatMessage } from '../../types';
import MessageBubble from './MessageBubble';

interface ChatHistoryProps {
  messages: ChatMessage[];
  onRegenerate: () => void;
}

const ChatHistory: React.FC<ChatHistoryProps> = ({ messages, onRegenerate }) => {
    const endOfMessagesRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {messages.map((msg, index) => (
                <MessageBubble 
                    key={msg.id} 
                    message={msg} 
                    isLast={index === messages.length - 1}
                    onRegenerate={onRegenerate}
                />
            ))}
            <div ref={endOfMessagesRef} />
        </div>
    );
};

export default ChatHistory;
