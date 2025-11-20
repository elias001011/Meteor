

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
  const { glassClass } = useTheme();

  useEffect(() => {
    setSelectedSource(preferredSource);
  }, [preferredSource]);

  if (!isOpen) return null;

  const handleApply = () => {
    onSourceChange(selectedSource);
  };

  return (
    <div 
        className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center lg:justify-start p-4 pb-28 lg:p-4 lg:pl-12 backdrop-blur-sm" 
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dataSourceModalTitle"
    >
        <div 
            className={`${glassClass} border border-gray-700/50 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col`}
            onClick={e => e.stopPropagation()}
        >
            <header className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
                <h2 id="dataSourceModalTitle" className="text-lg font-bold text-white">Fontes de Dados do Clima</h2>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                    <XIcon className="w-5 h-5" />
                </button>
            </header>
            
            <main className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
                <div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Fonte de Dados Ativa</h3>
                    <p className="text-cyan-400 font-bold text-lg">{currentSource ? sourceDetails[currentSource as SourceKey].name : 'N/D'}</p>
                    <p className="text-xs text-gray-400 mt-1">Esta é a fonte que forneceu os dados que você está vendo agora.</p>
                </div>
                
                <div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Alterar Fonte Preferencial</h3>
                    <div className="space-y-3">
                        {Object.entries(sourceDetails).map(([key, { name, description }]) => {
                            const isSelected = selectedSource === key;
                            return (
                                <label 
                                    key={key} 
                                    className={`flex items-start gap-3 p-4 rounded-xl cursor-pointer border transition-all duration-200 ${isSelected ? 'bg-cyan-500/10 border-cyan-500/50' : 'bg-white/5 border-transparent hover:bg-white/10'}`}
                                >
                                    <div className="mt-1">
                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? 'border-cyan-500' : 'border-gray-500'}`}>
                                            {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-cyan-500" />}
                                        </div>
                                        <input 
                                            type="radio" 
                                            name="data-source"
                                            value={key}
                                            checked={isSelected}
                                            onChange={() => setSelectedSource(key as SourceKey)}
                                            className="hidden"
                                        />
                                    </div>
                                    <div>
                                        <p className={`font-semibold ${isSelected ? 'text-cyan-400' : 'text-gray-200'}`}>{name}</p>
                                        <p className="text-sm text-gray-400 mt-1 leading-relaxed">{description}</p>
                                    </div>
                                </label>
                            );
                        })}
                    </div>
                </div>
            </main>

            <footer className="p-4 bg-gray-900/50 border-t border-white/10 flex-shrink-0">
                 <button 
                    onClick={handleApply}
                    className="w-full bg-cyan-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-cyan-500 transition-all disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed shadow-lg"
                    disabled={selectedSource === preferredSource}
                >
                    Aplicar e Atualizar
                </button>
            </footer>
        </div>
    </div>
  );
};

export default DataSourceModal;