





import React from 'react';
import type { AirQualityData } from '../../types';
import { useTheme } from '../context/ThemeContext';

interface AirQualityProps {
    data: AirQualityData;
}

interface AqiInfo {
    level: string;
    colorClass: string;
    textColorClass: string;
    percentage: number;
}

const getAqiInfo = (aqi: number): AqiInfo => {
    const levels = ['Boa', 'Razoável', 'Moderada', 'Ruim', 'Muito Ruim'];
    const colors = ['bg-green-500', 'bg-yellow-500', 'bg-orange-500', 'bg-red-500', 'bg-purple-500'];
    const textColors = ['text-green-400', 'text-yellow-400', 'text-orange-400', 'text-red-400', 'text-purple-400'];
    const index = Math.max(0, aqi - 1);
    const percentage = (aqi / 5) * 100;
    
    return {
        level: levels[index] || 'Desconhecido',
        colorClass: colors[index] || 'bg-gray-500',
        textColorClass: textColors[index] || 'text-gray-400',
        percentage,
    };
};

const Pollutant: React.FC<{ name: string; value: number | undefined }> = ({ name, value }) => (
    <div className="py-2.5">
        <p className="text-[11px] text-slate-500">{name}</p>
        <p className="mt-0.5 text-sm font-medium text-slate-200">{typeof value === 'number' ? value.toFixed(1) : '—'} <span className="text-[10px] font-normal text-slate-600">μg/m³</span></p>
    </div>
);


const AirQuality: React.FC<AirQualityProps> = ({ data }) => {
    const { cardClass } = useTheme();
    const aqiInfo = typeof data.aqi === 'number' ? getAqiInfo(data.aqi) : null;

    return (
        <section className={`rounded-2xl p-4 sm:p-5 ${cardClass} animate-enter`} aria-labelledby="air-quality-title">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h3 id="air-quality-title" className="text-sm font-semibold text-white">Qualidade do ar</h3>
                 {aqiInfo && (
                    <p className={`mt-1 text-lg font-semibold ${aqiInfo.textColorClass}`}>{aqiInfo.level}</p>
                 )}
                </div>
                <span className="text-xs text-slate-500">Índice {data.aqi ?? '—'} de 5</span>
            </div>
            {aqiInfo && (
                <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/[0.07]">
                    <div className={`${aqiInfo.colorClass} h-full rounded-full transition-[width] duration-700`} style={{ width: `${aqiInfo.percentage}%` }} />
                </div>
            )}
            <div className="mt-3 grid grid-cols-2 gap-x-4 sm:grid-cols-4 xl:grid-cols-2">
                    <Pollutant name="PM2.5" value={data.components.pm2_5} />
                    <Pollutant name="Ozônio (O₃)" value={data.components.o3} />
                    <Pollutant name="Dióxido de nitrogênio" value={data.components.no2} />
                    <Pollutant name="Dióxido de enxofre" value={data.components.so2} />
                </div>
        </section>
    );
};

export default AirQuality;
