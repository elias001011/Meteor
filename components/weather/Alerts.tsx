import React from 'react';
import type { WeatherAlert } from '../../types';
import { AlertTriangleIcon, InfoIcon } from '../icons';

interface AlertsProps {
    alerts: WeatherAlert[];
}

const Alerts: React.FC<AlertsProps> = ({ alerts }) => {
    if (!alerts || alerts.length === 0) {
        return (
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-4 text-gray-400">
                <div className="flex items-center gap-3">
                    <InfoIcon className="w-6 h-6 flex-shrink-0 text-gray-500" />
                    <div>
                        <h3 className="font-bold text-white">Alertas Meteorológicos</h3>
                        <p className="text-sm mt-1">Nenhum alerta no momento.</p>
                    </div>
                </div>
            </div>
        );
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
        <div className="space-y-3">
            {alerts.map((alert, index) => (
                <div key={index} className="bg-yellow-500/20 border border-yellow-500/30 rounded-2xl p-4 text-yellow-200">
                    <div className="flex items-start gap-3">
                        <AlertTriangleIcon className="w-6 h-6 flex-shrink-0 text-yellow-400 mt-1" />
                        <div>
                            <h3 className="font-bold text-white">{alert.event}</h3>
                            <p className="text-sm mt-1">{alert.description}</p>
                            <p className="text-xs text-yellow-300/80 mt-2">
                                Emitido por: {alert.sender_name}
                            </p>
                            <p className="text-xs text-yellow-300/80 mt-1">
                                Válido de {formatDate(alert.start)} até {formatDate(alert.end)}
                            </p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default Alerts;