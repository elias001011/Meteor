import React from 'react';
import { DatabaseIcon } from '../icons';

interface DataSourceInfoProps {
    source: 'onecall' | 'free' | null;
    lastUpdated: number | null;
}

const DataSourceInfo: React.FC<DataSourceInfoProps> = ({ source, lastUpdated }) => {
    if (!source || !lastUpdated) return null;

    const sourceName = source === 'onecall' ? 'One Call API 3.0' : 'Developer Tier APIs';
    const formattedTime = new Date(lastUpdated).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <div className="text-center text-xs text-gray-500 mt-2 px-4 pb-2">
            <div className="flex items-center justify-center gap-2">
                <DatabaseIcon className="w-4 h-4" />
                <span>
                    Fonte: {sourceName}. Atualizado às {formattedTime}.
                </span>
            </div>
        </div>
    );
};
export default DataSourceInfo;
