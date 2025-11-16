import React from 'react';
import { DatabaseIcon } from '../icons';
import type { DataSource } from '../../types';

interface DataSourceInfoProps {
    source: DataSource | null;
    lastUpdated: number | null;
    onClick: () => void;
}

const DataSourceInfo: React.FC<DataSourceInfoProps> = ({ source, lastUpdated, onClick }) => {
    if (!source || !lastUpdated) return null;

    const sourceNameMap: Record<DataSource, string> = {
        'onecall': 'OpenWeather (OneCall)',
        'free': 'OpenWeather (Padrão)',
        'open-meteo': 'Open-Meteo'
    };
    
    const sourceName = sourceNameMap[source] || 'Fonte Desconhecida';
    const formattedTime = new Date(lastUpdated).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <button 
            onClick={onClick}
            className="w-full text-center text-xs text-gray-500 hover:text-gray-300 transition-colors mt-2 px-4 pb-2 group"
            aria-label="Ver detalhes da fonte de dados e alterar"
        >
            <div className="flex items-center justify-center gap-2">
                <DatabaseIcon className="w-4 h-4" />
                <span className="group-hover:underline">
                    Fonte: {sourceName}. Atualizado às {formattedTime}.
                </span>
            </div>
        </button>
    );
};
export default DataSourceInfo;