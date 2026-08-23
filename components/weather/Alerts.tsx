
import React from 'react';
import type { WeatherAlert } from '../../types';
import { AlertTriangleIcon } from '../icons';

interface AlertsProps {
    alerts: WeatherAlert[];
}

const Alerts: React.FC<AlertsProps> = ({ alerts }) => {
    if (!alerts || alerts.length === 0) {
        return null;
    }

    const formatDate = (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleDateString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
            day: 'numeric',
            month: 'short'
        });
    };

    return (
        <div className="space-y-3 animate-enter">
            {alerts.map((alert, index) => (
                <div key={index} className="rounded-xl border border-white/[0.08] border-l-2 border-l-red-400 bg-[#111419] p-4 sm:p-5">
                    
                    {/* Header */}
                    <div className="mb-3 flex items-center gap-2.5">
                        <AlertTriangleIcon className="h-4 w-4 flex-none text-red-300" />
                        <h3 className="font-medium leading-tight text-white">{alert.event}</h3>
                    </div>

                    {/* Description Body */}
                    <p className="mb-4 text-sm leading-relaxed text-gray-300">
                        {alert.description}
                    </p>

                    {/* Footer Tags */}
                    <div className="flex flex-col gap-1 text-xs text-slate-500 sm:flex-row sm:gap-4">
                         <div>
                             Fonte: {alert.sender_name}
                         </div>
                         <div>
                             Até {formatDate(alert.end)}
                         </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default Alerts;
