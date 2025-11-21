

import React, { useState } from 'react';
import type { ChatMessage } from '../../types';
import { LinkIcon, InfoIcon } from '../icons';
import { useTheme } from '../context/ThemeContext';

interface MessageBubbleProps {
  message: ChatMessage;
  isLast?: boolean;
  onRegenerate?: () => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isLast, onRegenerate }) => {
  const isModel = message.role === 'model';
  const { classes } = useTheme();
  const [showInfo, setShowInfo] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Simple formatter
  const renderFormattedText = (text: string) => {
    // Split by newlines to handle block elements
    const lines = text.split('\n');
    
    return lines.map((line, i) => {
        // Headers
        if (line.startsWith('### ')) return <h3 key={i} className="text-md font-bold mt-3 mb-1 text-white">{line.substring(4)}</h3>;
        if (line.startsWith('## ')) return <h2 key={i} className="text-lg font-bold mt-4 mb-2 text-white">{line.substring(3)}</h2>;
        if (line.startsWith('# ')) return <h1 key={i} className="text-xl font-bold mt-4 mb-2 text-white border-b border-white/10 pb-1">{line.substring(2)}</h1>;
        
        // Lists (Bullet)
        if (line.trim().startsWith('- ')) {
             return (
                <div key={i} className="flex gap-2 ml-2 my-1">
                    <span className="text-gray-400">•</span>
                    <span className="flex-1">{parseInlineFormatting(line.substring(2))}</span>
                </div>
             );
        }

        // Empty lines
        if (line.trim() === '') return <div key={i} className="h-2"></div>;

        // Paragraphs
        return <p key={i} className="my-0.5">{parseInlineFormatting(line)}</p>;
    });
  };

  const parseInlineFormatting = (text: string) => {
      // Very basic parser for **bold** and *italic*
      const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
      return parts.map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) return <strong key={j} className="text-white font-bold">{part.substring(2, part.length - 2)}</strong>;
          if (part.startsWith('*') && part.endsWith('*')) return <em key={j} className="italic text-gray-200">{part.substring(1, part.length - 1)}</em>;
          if (part.startsWith('`') && part.endsWith('`')) return <code key={j} className="bg-black/30 px-1 py-0.5 rounded text-xs font-mono text-cyan-300">{part.substring(1, part.length - 1)}</code>;
          return part;
      });
  };

  const handleCopy = () => {
      navigator.clipboard.writeText(message.text);
  };

  const handleSpeak = () => {
      if (isSpeaking) {
          window.speechSynthesis.cancel();
          setIsSpeaking(false);
          return;
      }
      const utterance = new SpeechSynthesisUtterance(message.text);
      utterance.lang = 'pt-BR';
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
  };

  return (
    <div className={`flex items-end ${isModel ? 'justify-start' : 'justify-end'} group animate-enter`}>
      <div className="flex flex-col max-w-[85%] md:max-w-2xl w-full">
        {/* Bubble */}
        <div
          className={`px-5 py-4 rounded-2xl shadow-sm ${
            isModel
              ? 'bg-gray-800/90 border border-gray-700/50 rounded-bl-none text-gray-100'
              : `${classes.bg} text-white rounded-br-none shadow-lg shadow-${classes.text.split('-')[1]}-500/20`
          }`}
        >
          <div className="text-base leading-relaxed space-y-1 break-words">
            {isModel ? renderFormattedText(message.text) : message.text}
            {!isModel && message.text.length === 0 ? '...' : ''}
          </div>
        </div>

        {/* Action Bar for AI Messages */}
        {isModel && message.text.length > 0 && (
            <div className="flex items-center gap-1 mt-2 ml-1 opacity-100 transition-opacity">
                <button onClick={handleCopy} className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors" title="Copiar texto">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                </button>
                <button onClick={handleSpeak} className={`p-1.5 rounded-lg transition-colors ${isSpeaking ? 'text-cyan-400 bg-cyan-400/10' : 'text-gray-500 hover:text-white hover:bg-gray-800'}`} title={isSpeaking ? "Parar leitura" : "Ler em voz alta"}>
                    {isSpeaking ? (
                         <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                    ) : (
                         <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
                    )}
                </button>
                {isLast && onRegenerate && (
                    <button onClick={onRegenerate} className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors" title="Regerar resposta">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg>
                    </button>
                )}
                <button onClick={() => setShowInfo(!showInfo)} className={`p-1.5 rounded-lg transition-colors ${showInfo ? 'text-cyan-400 bg-cyan-400/10' : 'text-gray-500 hover:text-white hover:bg-gray-800'}`} title="Detalhes técnicos">
                    <InfoIcon className="w-4 h-4" />
                </button>
            </div>
        )}
        
        {/* Info Panel */}
        {showInfo && isModel && (
            <div className="mt-2 ml-1 p-4 bg-gray-900/80 border border-gray-700/50 rounded-xl text-xs text-gray-400 animate-enter backdrop-blur-md">
                <div className="grid grid-cols-1 gap-2">
                    <div className="flex justify-between border-b border-white/5 pb-2">
                        <span>Modelo:</span> 
                        <span className="text-white font-mono">{message.modelUsed || 'Gemini 2.5 Flash Lite'}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                        <span>Tempo de Processamento:</span> 
                        <span className="text-white">{message.processingTime ? `${(message.processingTime / 1000).toFixed(2)}s` : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Ação Executada:</span> 
                        <span className={`${message.toolExecuted ? 'text-cyan-400 font-bold' : 'text-gray-500'}`}>
                            {message.toolExecuted || 'Nenhuma'}
                        </span>
                    </div>
                </div>
            </div>
        )}

        {/* Sources */}
        {message.sources && message.sources.length > 0 && (
          <div className="mt-3 ml-1">
            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-2">Fontes</p>
            <div className="flex flex-wrap gap-2">
              {message.sources.map((source, index) => (
                <a 
                  key={index} 
                  href={source.uri} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className={`text-xs ${classes.text} bg-gray-800/50 border border-gray-700 hover:bg-gray-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5 max-w-full truncate transition-all hover:border-gray-500`}
                >
                  <LinkIcon className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate max-w-[200px]">{source.title || new URL(source.uri).hostname}</span>
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