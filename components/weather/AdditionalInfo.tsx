
import React, { useState } from 'react';
import type { WeatherData, UnitSystem } from '../../types';
import { WindIcon, DropletsIcon, GaugeIcon, SunIcon, EyeIcon, CloudIcon, ThermometerIcon, CloudRainIcon, CloudSnowIcon, SunriseIcon, SunsetIcon } from '../icons';
import { useTheme } from '../context/ThemeContext';
import ForecastDetailModal from './ForecastDetailModal';

interface AdditionalInfoProps {
  data: WeatherData;
  unitSystem: UnitSystem;
}

const InfoItem: React.FC<{ icon: React.ReactNode; label: string; value: string | number; iconSize: string; textSize: string; subtextSize: string; onClick: (val: string) => void }> = ({ icon, label, value, iconSize, textSize, subtextSize, onClick }) => (
    <button onClick={() => onClick(String(value))} className="flex items-center gap-3 p-2 rounded-xl transition-colors hover:bg-white/5 min-w-0 w-full text-left group">
        <div className={`bg-white/5 rounded-full p-2 flex-shrink-0 group-hover:bg-white/10 transition-colors`}>
            {icon}
        </div>
        <div className="min-w-0 flex-1">
            <p className={`text-gray-500 font-bold uppercase tracking-wider truncate ${subtextSize}`}>{label}</p>
            <p className={`font-bold text-slate-100 truncate ${textSize}`}>{value}</p>
        </div>
    </button>
);

const degreesToCardinal = (deg: number): string => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return directions[Math.round(deg / 45) % 8];
};

const AdditionalInfo: React.FC<AdditionalInfoProps> = ({ data, unitSystem }) => {
  const { classes, cardClass, density } = useTheme();
  const [selectedInfo, setSelectedInfo] = useState<string | null>(null);

  const formatTime = (timestamp: number) => {
      const offset = data.timezoneOffset || 0;
      const date = new Date((timestamp + offset) * 1000);
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
  };

  const getUviInfo = (uvi: number) => {
    const u = Math.round(uvi);
    if (u <= 2) return { level: 'Baixo', val: u };
    if (u <= 5) return { level: 'Mod.', val: u };
    return { level: 'Alto', val: u };
  };
  
  const uviInfo = typeof data.uvi === 'number' ? getUviInfo(data.uvi) : null;
  const iconClass = `${density.iconSize} ${classes.text}`;
  
  const handleItemClick = (text: string) => {
      setSelectedInfo(text);
  };

  const itemProps = { iconSize: density.iconSize, textSize: density.text, subtextSize: 'text-[10px]', onClick: handleItemClick };

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
        <div className={`rounded-3xl ${density.padding} ${cardClass} animate-enter`}>
            {/* Grid Layout Adjusted: 2 Cols (Mobile/Tablet Small), 3 Cols (Tablet/Desktop Small), 4 Cols (Large Desktop) */}
            <div className={`grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${density.gap} gap-y-4`}>
                {/* Sunrise / Sunset */}
                <InfoItem icon={<SunriseIcon className={iconClass} />} label="Nascer" value={formatTime(data.sunrise)} {...itemProps} />
                <InfoItem icon={<SunsetIcon className={iconClass} />} label="Pôr" value={formatTime(data.sunset)} {...itemProps} />
                
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
        </div>

        <ForecastDetailModal 
            isOpen={!!selectedInfo} 
            onClose={() => setSelectedInfo(null)} 
            data={{ description: selectedInfo || '' }}
            isComplex={false} // Use simple toast mode
        />
    </>
  );
};

export default AdditionalInfo;
