
import React from 'react';
import type { WeatherAlert } from '../../types';
import { AlertTriangleIcon } from '../icons';
import { useTheme } from '../context/ThemeContext';

interface AlertsProps {
    alerts: WeatherAlert[];
}

const Alerts: React.FC<AlertsProps> = ({ alerts }) => {
    // We intentionally ignore the global 'cardClass' to enforce the specific Red Alert look
    // However, we still want to respect the 'glass' feel if transparency is enabled globally.
    // So we use a custom class that mimics the RS Alerta look but adapts slightly.
    const { transparencyMode, isPerformanceMode } = useTheme();

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

    const getAlertStyle = () => {
        if (isPerformanceMode) return 'bg-[#2A1515] border border-red-900/50';
        
        switch (transparencyMode) {
            case 'glass':
                return 'bg-[#2A1515]/90 backdrop-blur-md border border-red-500/20 shadow-lg';
            case 'transparent':
            case 'balanced':
            case 'subtle':
                 return 'bg-[#2A1515]/95 border border-red-500/20 shadow-lg';
            default: // off
                 return 'bg-[#2A1515] border border-red-900/50 shadow-md';
        }
    };

    return (
        <div className="space-y-4 animate-enter">
            {alerts.map((alert, index) => (
                <div key={index} className={`rounded-3xl p-6 relative overflow-hidden ${getAlertStyle()}`}>
                    {/* Icon and Title Header */}
                    <div className="flex items-center gap-4 mb-4">
                        <div className="bg-red-500/20 p-3 rounded-full flex-shrink-0 border border-red-500/10">
                            <AlertTriangleIcon className="w-8 h-8 text-red-400" />
                        </div>
                        <h3 className="font-bold text-white text-xl tracking-wide">{alert.event}</h3>
                    </div>

                    {/* Description Body */}
                    <p className="text-gray-300 text-sm leading-relaxed mb-6 font-medium">
                        {alert.description}
                    </p>

                    {/* Footer Tags */}
                    <div className="flex flex-col sm:flex-row gap-3">
                         <div className="bg-[#3F1F1F] border border-red-500/10 rounded-lg px-4 py-2 text-xs text-red-200 font-medium">
                             Fonte: {alert.sender_name}
                         </div>
                         <div className="bg-[#3F1F1F] border border-red-500/10 rounded-lg px-4 py-2 text-xs text-red-200 font-medium">
                             Até {formatDate(alert.end)}
                         </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default Alerts;
