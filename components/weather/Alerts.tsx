

import React from 'react';
import type { WeatherAlert } from '../../types';
import { AlertTriangleIcon } from '../icons';
import { useTheme } from '../context/ThemeContext';

interface AlertsProps {
    alerts: WeatherAlert[];
}

const Alerts: React.FC<AlertsProps> = ({ alerts }) => {
    const { cardClass } = useTheme();

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
                <div key={index} className={`${cardClass} border-l-4 border-l-red-500 rounded-2xl p-4 text-red-100 relative overflow-hidden`}>
                    <div className="absolute inset-0 bg-red-500/10 z-0"></div>
                    <div className="relative z-10 flex items-start gap-3">
                        <div className="bg-red-500/20 p-2 rounded-full">
                            <AlertTriangleIcon className="w-6 h-6 flex-shrink-0 text-red-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-lg">{alert.event}</h3>
                            <p className="text-sm mt-1 text-red-200/90 leading-relaxed">{alert.description}</p>
                            <div className="flex flex-wrap gap-2 mt-3">
                                <span className="text-xs bg-red-950/50 px-2 py-1 rounded border border-red-500/20 text-red-300">
                                    Fonte: {alert.sender_name}
                                </span>
                                <span className="text-xs bg-red-950/50 px-2 py-1 rounded border border-red-500/20 text-red-300">
                                    Até {formatDate(alert.end)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default Alerts;