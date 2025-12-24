
import React from 'react';
import type { WeatherAlert } from '../../types';
import { AlertTriangleIcon } from '../icons';
import { useTheme } from '../context/ThemeContext';

interface AlertsProps {
    alerts: WeatherAlert[];
}

const Alerts: React.FC<AlertsProps> = ({ alerts }) => {
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
        if (isPerformanceMode) {
            // Solid dark red for performance
            return 'bg-red-950 border border-red-900';
        }
        
        // Base border for all modes
        const border = 'border border-red-500/30';
        
        switch (transparencyMode) {
            case 'glass':
                // High transparency with blur for rain visibility
                return `bg-red-950/40 backdrop-blur-md backdrop-saturate-150 ${border} shadow-lg`;
            case 'transparent':
                // High transparency, no blur
                return `bg-red-950/50 ${border} shadow-lg`;
            case 'balanced':
                // Medium transparency
                return `bg-red-950/70 ${border} shadow-lg`;
            case 'subtle':
                // Low transparency
                return `bg-red-950/90 ${border} shadow-lg`;
            default: // off
                // Solid
                return `bg-red-950 ${border} shadow-md`;
        }
    };

    // Helper for inner elements to also be slightly transparent/glassy
    const getInnerTagStyle = () => {
        if (isPerformanceMode) return 'bg-red-900/50';
        if (transparencyMode === 'glass') return 'bg-red-900/30 backdrop-blur-sm';
        return 'bg-red-900/40';
    };

    return (
        <div className="space-y-4 animate-enter">
            {alerts.map((alert, index) => (
                <div key={index} className={`rounded-3xl p-6 relative overflow-hidden transition-all duration-300 ${getAlertStyle()}`}>
                    
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-4 relative z-10">
                        <div className={`p-3 rounded-full flex-shrink-0 border border-red-500/20 text-red-400 ${getInnerTagStyle()}`}>
                            <AlertTriangleIcon className="w-8 h-8" />
                        </div>
                        <h3 className="font-bold text-white text-xl tracking-wide leading-tight">{alert.event}</h3>
                    </div>

                    {/* Description Body */}
                    <p className="text-gray-200 text-sm leading-relaxed mb-6 font-medium relative z-10 opacity-90">
                        {alert.description}
                    </p>

                    {/* Footer Tags */}
                    <div className="flex flex-col sm:flex-row gap-3 relative z-10">
                         <div className={`border border-red-500/10 rounded-lg px-4 py-2 text-xs text-red-200 font-medium ${getInnerTagStyle()}`}>
                             Fonte: {alert.sender_name}
                         </div>
                         <div className={`border border-red-500/10 rounded-lg px-4 py-2 text-xs text-red-200 font-medium ${getInnerTagStyle()}`}>
                             Até {formatDate(alert.end)}
                         </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default Alerts;
