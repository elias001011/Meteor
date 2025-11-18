
import React from 'react';
import { SendIcon, MicIcon, SearchIcon } from '../icons';
import { useTheme } from '../context/ThemeContext';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  isSending: boolean;
  isListening: boolean;
  onToggleListening: () => void;
  isSearchEnabled: boolean;
  onToggleSearch: () => void;
  text: string;
  setText: (text: string) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ 
    onSendMessage, 
    isSending, 
    isListening, 
    onToggleListening,
    isSearchEnabled,
    onToggleSearch,
    text,
    setText
}) => {
  const { classes } = useTheme();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() && !isSending && !isListening) {
      onSendMessage(text);
      setText('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 w-full">
      <button 
        type="button" 
        onClick={onToggleListening}
        className={`p-2 transition-colors rounded-full ${isListening ? 'text-red-500 bg-red-500/20 animate-pulse' : 'text-gray-400 hover:text-white'}`}
        aria-label={isListening ? "Parar gravação" : "Iniciar gravação"}
      >
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
        placeholder={isListening ? "Ouvindo..." : "Pergunte algo..."}
        rows={1}
        disabled={isListening}
        className={`flex-1 bg-gray-700/50 border border-gray-600/50 rounded-full py-2 px-4 text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 ${classes.ring} max-h-14 disabled:bg-gray-800 disabled:cursor-not-allowed`}
      />
       <button 
        type="button" 
        onClick={onToggleSearch}
        className={`p-2 transition-colors rounded-full ${isSearchEnabled ? `${classes.text} ${classes.bg.replace('bg-', 'bg-').replace('500','500/20').replace('600', '600/20')}` : 'text-gray-400 hover:text-white'}`}
        aria-label={isSearchEnabled ? "Desativar pesquisa na web" : "Ativar pesquisa na web"}
      >
          <SearchIcon className="w-6 h-6" />
      </button>
      <button
        type="submit"
        disabled={isSending || !text.trim() || isListening}
        className={`${classes.bg} ${classes.bgHover} text-white rounded-full p-3 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed`}
      >
        <SendIcon className="w-5 h-5" />
      </button>
    </form>
  );
};

export default ChatInput;