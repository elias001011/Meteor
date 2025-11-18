
import React, { useRef, useEffect } from 'react';
import type { ChatMessage } from '../../types';
import MessageBubble from './MessageBubble';

interface ChatHistoryProps {
  messages: ChatMessage[];
}

const ChatHistory: React.FC<ChatHistoryProps> = ({ messages }) => {
    const endOfMessagesRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
            ))}
            <div ref={endOfMessagesRef} />
        </div>
    );
};

export default ChatHistory;
