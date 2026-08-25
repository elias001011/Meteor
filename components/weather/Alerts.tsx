
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
                <article key={index} className="overflow-hidden rounded-2xl border border-red-400/20 bg-red-950/25">
                    
                    {/* Header */}
                    <div className="flex items-start gap-3 p-4 sm:p-5">
                        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-400/10 text-red-300">
                            <AlertTriangleIcon className="h-[18px] w-[18px]" />
                        </span>
                        <div className="min-w-0 flex-1">
                            <h3 className="font-semibold leading-tight text-white">{alert.event}</h3>

                            <p className="mt-2 text-sm leading-relaxed text-slate-300">
                                {alert.description}
                            </p>

                            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-red-100/45">
                                <span>{alert.sender_name || 'Autoridade meteorológica'}</span>
                                <span>Válido até {formatDate(alert.end)}</span>
                            </div>
                        </div>
                    </div>
                </article>
            ))}
        </div>
    );
};

export default Alerts;
