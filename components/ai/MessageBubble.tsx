
import React, { useState } from 'react';
import type { ChatMessage } from '../../types';
import { LinkIcon, CopyIcon, VolumeIcon, InfoIcon, CheckIcon, RefreshCwIcon } from '../icons';
import { useTheme } from '../context/ThemeContext';

interface MessageBubbleProps {
  message: ChatMessage;
  onRegenerate?: () => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onRegenerate }) => {
  const isModel = message.role === 'model';
  const { classes } = useTheme();
  const [isCopied, setIsCopied] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Stronger regex cleaning
  const cleanText = (raw: string) => {
      return raw
        .replace(/\$|\\text\{|\}|\\circ/g, '') // Math junk
        .replace(/\*\*(.*?):\*/g, '**$1:**') // Fix "**Title:*" -> "**Title:**"
        .replace(/:\*/g, ':'); // Catch remaining ":*"
  };

  const renderFormattedText = (rawText: string) => {
    const text = cleanText(rawText);
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
    return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) return <strong key={index}>{part.substring(2, part.length - 2)}</strong>;
        if (part.startsWith('*') && part.endsWith('*')) return <em key={index}>{part.substring(1, part.length - 1)}</em>;
        if (part.startsWith('`') && part.endsWith('`')) return <code key={index} className="bg-gray-800 px-1 rounded text-sm font-mono">{part.substring(1, part.length - 1)}</code>;
        return part;
    });
  };

  const handleCopy = () => {
      navigator.clipboard.writeText(cleanText(message.text));
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSpeak = () => {
      if ('speechSynthesis' in window) {
          if (isSpeaking) {
              window.speechSynthesis.cancel();
              setIsSpeaking(false);
          } else {
              const utterance = new SpeechSynthesisUtterance(cleanText(message.text));
              utterance.lang = 'pt-BR';
              utterance.onend = () => setIsSpeaking(false);
              window.speechSynthesis.speak(utterance);
              setIsSpeaking(true);
          }
      }
  };

  if (message.role === 'system') return null;

  return (
    <div className={`flex items-end gap-2 mb-4 ${isModel ? 'justify-start' : 'justify-end'}`}>
      
      <div className="flex flex-col max-w-[95%] sm:max-w-[85%]">
        <div
          className={`relative px-5 py-3.5 rounded-2xl shadow-sm text-base leading-relaxed ${
            isModel
              ? 'bg-gray-800 text-gray-100 rounded-tl-none'
              : `${classes.bg} text-white rounded-br-none`
          }`}
        >
          <div className="whitespace-pre-wrap break-words">
            {renderFormattedText(message.text)}
            {message.isError && <span className="text-red-400 text-sm block mt-2">⚠ Erro na geração.</span>}
            {!isModel && message.text.length === 0 ? '...' : ''}
          </div>
        </div>

        {/* Action Bar for AI Messages */}
        {isModel && message.text.length > 0 && (
            <div className="flex items-center gap-1 mt-1 ml-1">
                <button onClick={handleCopy} className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-700 rounded-full transition-colors" title="Copiar">
                    {isCopied ? <CheckIcon className="w-4 h-4 text-green-400" /> : <CopyIcon className="w-4 h-4" />}
                </button>
                <button onClick={handleSpeak} className={`p-1.5 hover:bg-gray-700 rounded-full transition-colors ${isSpeaking ? 'text-green-400 animate-pulse' : 'text-gray-500 hover:text-white'}`} title="Ler em voz alta">
                    <VolumeIcon className="w-4 h-4" />
                </button>
                {onRegenerate && (
                     <button onClick={onRegenerate} className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-700 rounded-full transition-colors" title="Regerar resposta">
                        <RefreshCwIcon className="w-4 h-4" />
                    </button>
                )}
                <button onClick={() => setShowInfo(!showInfo)} className={`p-1.5 hover:bg-gray-700 rounded-full transition-colors ${showInfo ? 'text-cyan-400' : 'text-gray-500 hover:text-white'}`} title="Informações da Resposta">
                    <InfoIcon className="w-4 h-4" />
                </button>
            </div>
        )}
        
        {showInfo && message.metadata && (
            <div className="mt-2 p-3 bg-gray-800/90 border border-gray-700 rounded-xl text-xs text-gray-400 animate-fade-in">
                <p><strong className="text-gray-300">Modelo:</strong> {message.metadata.model}</p>
                <p><strong className="text-gray-300">Latência:</strong> {message.metadata.latencyMs}ms</p>
                <p><strong className="text-gray-300">Processado:</strong> {new Date(message.metadata.timestamp).toLocaleTimeString()}</p>
                {message.metadata.commandsExecuted && (
                    <div className="mt-1">
                        <strong className="text-gray-300">Comandos:</strong>
                        <ul className="list-disc list-inside text-gray-500">
                            {message.metadata.commandsExecuted.map((cmd, i) => <li key={i}>{cmd}</li>)}
                        </ul>
                    </div>
                )}
            </div>
        )}

        {message.sources && message.sources.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            <div className="w-full text-xs text-gray-500 font-semibold uppercase mb-1">Fontes Consultadas</div>
            {message.sources.map((source, index) => (
              <a 
                key={index} 
                href={source.uri} 
                target="_blank" 
                rel="noopener noreferrer" 
                className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 hover:border-gray-600 hover:bg-gray-700 transition-all text-xs text-gray-300 max-w-full`}
              >
                <LinkIcon className="w-3 h-3 flex-shrink-0" />
                <span className="truncate max-w-[200px]">{source.title || new URL(source.uri).hostname}</span>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
