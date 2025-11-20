
import React, { useState, useEffect } from 'react';
import type { DataSource } from '../../types';
import { XIcon } from '../icons';
import { useTheme } from '../context/ThemeContext';

interface DataSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSource: DataSource | null;
  preferredSource: DataSource | 'auto';
  onSourceChange: (source: DataSource | 'auto') => void;
}

const sourceDetails = {
    auto: {
        name: "Automático (Recomendado)",
        description: "Seleciona a melhor fonte de dados disponível, com fallback automático em caso de falha. Prioriza dados mais completos e alertas em tempo real."
    },
    onecall: {
        name: "OpenWeather (OneCall)",
        description: "Fonte primária com dados detalhados, incluindo alertas meteorológicos, índice UV e mais. Sujeito a um limite diário de requisições."
    },
    free: {
        name: "OpenWeather (Padrão)",
        description: "Fonte de fallback com dados essenciais. Não inclui alertas meteorológicos e alguns detalhes finos, mas é altamente confiável."
    },
    'open-meteo': {
        name: "Open-Meteo",
        description: "Fonte de dados global de código aberto. Rápido e confiável, mas não fornece alertas meteorológicos nem um índice de qualidade do ar (IQAR) unificado."
    }
};

type SourceKey = keyof typeof sourceDetails;

const DataSourceModal: React.FC<DataSourceModalProps> = ({
  isOpen,
  onClose,
  currentSource,
  preferredSource,
  onSourceChange,
}) => {
  const [selectedSource, setSelectedSource] = useState<DataSource | 'auto'>(preferredSource);
  const { classes, glassClass } = useTheme();

  useEffect(() => {
    setSelectedSource(preferredSource);
  }, [preferredSource]);

  if (!isOpen) return null;

  const handleApply = () => {
    onSourceChange(selectedSource);
  };

  return (
    <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] flex items-center justify-center lg:justify-start p-4 pb-28 lg:p-4 lg:pl-12 animate-fade-in" 
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dataSourceModalTitle"
    >
        <div 
            className={`${glassClass} border border-gray-700/50 rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden`}
            onClick={e => e.stopPropagation()}
        >
            <header className="flex items-center justify-between p-5 border-b border-gray-700/50 flex-shrink-0 bg-gray-900/50">
                <h2 id="dataSourceModalTitle" className="text-lg font-bold text-white">Fontes de Dados</h2>
                <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-700 text-gray-400 hover:text-white transition-colors">
                    <XIcon className="w-5 h-5" />
                </button>
            </header>
            
            <main className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
                <div className="bg-gray-800/40 rounded-xl p-4 border border-gray-700/30">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Fonte Ativa</h3>
                    <p className={`text-lg font-bold ${classes.text}`}>{currentSource ? sourceDetails[currentSource as SourceKey].name : 'N/D'}</p>
                    <p className="text-xs text-gray-400 mt-1">Esta é a API que está fornecendo os dados atuais na tela.</p>
                </div>
                
                <div>
                    <h3 className="text-sm font-bold text-white mb-3">Preferência de Fonte</h3>
                    <div className="space-y-3">
                        {Object.entries(sourceDetails).map(([key, { name, description }]) => (
                            <label 
                                key={key} 
                                className={`flex items-start gap-3 p-4 bg-gray-900/80 rounded-xl cursor-pointer border-2 transition-all duration-200 ${
                                    selectedSource === key ? classes.border + ' shadow-lg shadow-black/20' : 'border-transparent hover:bg-gray-800'
                                }`}
                            >
                                <div className="pt-0.5">
                                    <input 
                                        type="radio" 
                                        name="data-source"
                                        value={key}
                                        checked={selectedSource === key}
                                        onChange={() => setSelectedSource(key as SourceKey)}
                                        className={`form-radio h-5 w-5 bg-gray-800 border-gray-600 focus:ring-offset-0 ${classes.text} ${classes.ring}`}
                                    />
                                </div>
                                <div>
                                    <p className={`font-semibold ${selectedSource === key ? 'text-white' : 'text-gray-300'}`}>{name}</p>
                                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{description}</p>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>
            </main>

            <footer className="p-5 bg-gray-900/80 border-t border-gray-700/50 flex-shrink-0 backdrop-blur-md">
                 <button 
                    onClick={handleApply}
                    className={`w-full ${classes.bg} ${classes.bgHover} text-white font-bold py-3.5 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg`}
                    disabled={selectedSource === preferredSource}
                >
                    {selectedSource === preferredSource ? 'Sem alterações' : 'Aplicar e Recarregar'}
                </button>
            </footer>
        </div>
    </div>
  );
};

export default DataSourceModal;
