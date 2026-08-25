
import React, { useState } from 'react';
import type { WeatherData, UnitSystem } from '../../types';
import { WindIcon, DropletsIcon, GaugeIcon, SunIcon, EyeIcon, CloudIcon, ThermometerIcon, CloudRainIcon, CloudSnowIcon } from '../icons';
import { useTheme } from '../context/ThemeContext';
import ForecastDetailModal from './ForecastDetailModal';

interface AdditionalInfoProps {
  data: WeatherData;
  unitSystem: UnitSystem;
}

const InfoItem: React.FC<{ icon: React.ReactNode; label: string; value: string | number; onClick: (val: string) => void }> = ({ icon, label, value, onClick }) => (
    <button onClick={() => onClick(String(value))} onMouseDown={event => event.preventDefault()} className="flex min-w-0 w-full items-center gap-2.5 rounded-lg px-1 py-2 text-left transition-colors hover:bg-white/[0.025] hover:text-white">
        <span className="flex-none text-slate-500">{icon}</span>
        <span className="min-w-0 flex-1">
            <span className="block truncate text-[11px] text-slate-500">{label}</span>
            <span className="block truncate text-sm font-medium text-slate-200">{value}</span>
        </span>
    </button>
);

const degreesToCardinal = (deg: number): string => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return directions[Math.round(deg / 45) % 8];
};

const AdditionalInfo: React.FC<AdditionalInfoProps> = ({ data, unitSystem }) => {
  const { cardClass } = useTheme();
  const [selectedInfo, setSelectedInfo] = useState<string | null>(null);

  const getUviInfo = (uvi: number) => {
    const u = Math.round(uvi);
    if (u <= 2) return { level: 'Baixo', val: u };
    if (u <= 5) return { level: 'Mod.', val: u };
    return { level: 'Alto', val: u };
  };
  
  const uviInfo = typeof data.uvi === 'number' ? getUviInfo(data.uvi) : null;
  const iconClass = 'h-4 w-4';
  
  const handleItemClick = (text: string) => {
      setSelectedInfo(text);
  };

  const itemProps = { onClick: handleItemClick };

  // Conversions
  const formatVisibility = (m: number) => {
      if (unitSystem === 'imperial') {
          // Meters to Miles
          const miles = m * 0.000621371;
          return `${miles.toFixed(1)} mi`;
      }
      if (m >= 1000) return `${(m / 1000).toFixed(0)} km`;
      return `${m} m`;
  };

  const formatWind = (kph: number) => {
      if (unitSystem === 'imperial') {
          // km/h to mph
          return Math.round(kph * 0.621371);
      }
      return kph;
  };

  const formatTemp = (c: number) => {
      if (unitSystem === 'imperial') {
          return Math.round((c * 9/5) + 32);
      }
      return Math.round(c);
  };

  const windSpeedDisplay = formatWind(data.windSpeed);
  const windGustDisplay = typeof data.wind_gust === 'number' ? formatWind(data.wind_gust) : null;
  const unitSpeed = unitSystem === 'imperial' ? 'mph' : 'km/h';
  const unitTemp = unitSystem === 'imperial' ? '°F' : '°C';

  return (
    <>
        <section className={`rounded-2xl p-4 sm:p-5 ${cardClass} animate-enter`} aria-labelledby="details-title">
            <h3 id="details-title" className="mb-1 text-sm font-semibold text-white">Informações gerais</h3>
            <div className="grid grid-cols-2 gap-x-3">
                {/* Wind & Gusts */}
                <InfoItem 
                    icon={<WindIcon className={iconClass} />} 
                    label={typeof data.wind_gust === 'number' ? "Vento / Rajada" : "Vento"} 
                    value={`${windSpeedDisplay} ${unitSpeed} ${degreesToCardinal(data.wind_deg || 0)}${windGustDisplay ? ` / ${windGustDisplay}` : ''}`} 
                    {...itemProps} 
                />

                {/* Humidity */}
                <InfoItem icon={<DropletsIcon className={iconClass} />} label="Umidade" value={`${data.humidity}%`} {...itemProps} />
                
                {/* Pressure */}
                <InfoItem icon={<GaugeIcon className={iconClass} />} label="Pressão" value={`${data.pressure} hPa`} {...itemProps} />
                
                {/* UV Index (If available) */}
                {uviInfo && (
                    <InfoItem icon={<SunIcon className={iconClass} />} label="Índice UV" value={`${uviInfo.val} (${uviInfo.level})`} {...itemProps} />
                )}

                {/* Visibility (If available) */}
                {typeof data.visibility === 'number' && (
                    <InfoItem icon={<EyeIcon className={iconClass} />} label="Visibilidade" value={formatVisibility(data.visibility)} {...itemProps} />
                )}

                {/* Clouds (If available) */}
                {typeof data.clouds === 'number' && (
                    <InfoItem icon={<CloudIcon className={iconClass} />} label="Nuvens" value={`${data.clouds}%`} {...itemProps} />
                )}
                
                {/* Dew Point (If available) */}
                {typeof data.dew_point === 'number' && (
                    <InfoItem icon={<ThermometerIcon className={iconClass} />} label="Orvalho" value={`${formatTemp(data.dew_point)}${unitTemp}`} {...itemProps} />
                )}

                {/* Rain Volume (If available) */}
                {typeof data.rain_1h === 'number' && (
                    <InfoItem icon={<CloudRainIcon className={iconClass} />} label="Chuva (1h)" value={`${data.rain_1h} mm`} {...itemProps} />
                )}
                
                {/* Snow Volume (If available) */}
                {typeof data.snow_1h === 'number' && (
                    <InfoItem icon={<CloudSnowIcon className={iconClass} />} label="Neve (1h)" value={`${data.snow_1h} mm`} {...itemProps} />
                )}
            </div>
        </section>

        <ForecastDetailModal 
            isOpen={!!selectedInfo} 
            onClose={() => setSelectedInfo(null)} 
            data={{ description: selectedInfo || '' }}
            isComplex={false} // Use simple toast mode for grid items as they display most data already
        />
    </>
  );
};

export default AdditionalInfo;
