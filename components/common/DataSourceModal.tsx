import React, { useState, useEffect } from 'react';
import type { DataSource } from '../../types';
import { XIcon } from '../icons';

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

  useEffect(() => {
    setSelectedSource(preferredSource);
  }, [preferredSource]);

  if (!isOpen) return null;

  const handleApply = () => {
    onSourceChange(selectedSource);
  };

  return (
    <div 
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center lg:justify-start p-4 lg:pl-12" 
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dataSourceModalTitle"
    >
        <div 
            className="bg-gray-800 border border-gray-700/50 rounded-2xl shadow-lg w-full max-w-md max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}
        >
            <header className="flex items-center justify-between p-4 border-b border-gray-700/50 flex-shrink-0">
                <h2 id="dataSourceModalTitle" className="text-lg font-bold">Fontes de Dados do Clima</h2>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700">
                    <XIcon className="w-5 h-5" />
                </button>
            </header>
            
            <main className="p-6 overflow-y-auto space-y-6">
                <div>
                    <h3 className="text-sm font-semibold text-gray-400 mb-2">Fonte de Dados Ativa</h3>
                    <p className="text-cyan-400 font-bold">{currentSource ? sourceDetails[currentSource as SourceKey].name : 'N/D'}</p>
                    <p className="text-xs text-gray-500 mt-1">Esta é a fonte que forneceu os dados que você está vendo agora.</p>
                </div>
                
                <div>
                    <h3 className="text-sm font-semibold text-gray-400 mb-3">Alterar Fonte Preferencial</h3>
                    <div className="space-y-3">
                        {Object.entries(sourceDetails).map(([key, { name, description }]) => (
                            <label key={key} className="flex items-start gap-3 p-3 bg-gray-900 rounded-lg cursor-pointer border-2 border-transparent has-[:checked]:border-cyan-500 transition-all">
                                <input 
                                    type="radio" 
                                    name="data-source"
                                    value={key}
                                    checked={selectedSource === key}
                                    onChange={() => setSelectedSource(key as SourceKey)}
                                    className="mt-1 form-radio h-4 w-4 text-cyan-600 bg-gray-700 border-gray-600 focus:ring-cyan-500"
                                />
                                <div>
                                    <p className="font-semibold">{name}</p>
                                    <p className="text-sm text-gray-400">{description}</p>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>
            </main>

            <footer className="p-4 bg-gray-900/50 border-t border-gray-700/50 flex-shrink-0">
                 <button 
                    onClick={handleApply}
                    className="w-full bg-cyan-500 text-white font-bold py-2 px-4 rounded-full hover:bg-cyan-400 transition-colors disabled:bg-gray-600"
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