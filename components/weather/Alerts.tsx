import React from 'react';
import type { WeatherAlert } from '../../types';
import { AlertTriangleIcon } from '../icons';

interface AlertsProps {
    data: WeatherAlert[];
}

const Alerts: React.FC<AlertsProps> = ({ data }) => {
    if (!data || data.length === 0) {
        return null;
    }

    return (
        <div className="bg-yellow-500/20 border border-yellow-500/30 backdrop-blur-sm rounded-3xl p-4 space-y-3">
            <div className="flex items-center gap-3 px-2">
                <AlertTriangleIcon className="w-6 h-6 text-yellow-400" />
                <h3 className="text-lg font-bold text-yellow-300">Alertas Ativos</h3>
            </div>
            {data.map((alert, index) => (
                <div key={index} className="bg-yellow-400/10 p-3 rounded-xl">
                    <h4 className="font-bold text-white">{alert.event}</h4>
                    <p className="text-sm text-gray-300 mt-1">{alert.description}</p>
                    <p className="text-xs text-gray-400 text-right mt-2">- {alert.sender_name}</p>
                </div>
            ))}
        </div>
    );
};

export default Alerts;
