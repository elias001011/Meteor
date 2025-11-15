import React, { useState } from 'react';
import { SendIcon, MicIcon } from '../icons';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  isSending: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isSending }) => {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() && !isSending) {
      onSendMessage(text);
      setText('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 w-full">
      <button type="button" className="p-2 text-gray-400 hover:text-white transition-colors">
          <MicIcon className="w-6 h-6" />
      </button>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
            }
        }}
        placeholder="Pergunte algo..."
        rows={1}
        className="flex-1 bg-gray-700/50 border border-gray-600/50 rounded-full py-2 px-4 text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500 max-h-14"
      />
      <button
        type="submit"
        disabled={isSending || !text.trim()}
        className="bg-cyan-500 text-white rounded-full p-3 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-cyan-400"
      >
        <SendIcon className="w-5 h-5" />
      </button>
    </form>
  );
};

export default ChatInput;