
import React, { useState, useEffect } from 'react';
import { SunriseIcon, SunsetIcon, SunIcon } from '../icons';
import { useTheme } from '../context/ThemeContext';

interface SunriseSunsetProps {
  sunrise: number;
  sunset: number;
  timezoneOffset?: number;
}

const SunriseSunset: React.FC<SunriseSunsetProps> = ({ sunrise, sunset, timezoneOffset = 0 }) => {
    const [sunPercentage, setSunPercentage] = useState(0);
    const [currentTimeLabel, setCurrentTimeLabel] = useState('');
    const { cardClass } = useTheme();

    // Helper to format time with timezone offset
    const formatTime = (timestamp: number) => {
        const date = new Date((timestamp + timezoneOffset) * 1000);
        // Use getUTC methods because we shifted the time to simulate local time on the UTC timeline
        const hours = date.getUTCHours().toString().padStart(2, '0');
        const minutes = date.getUTCMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    };

    useEffect(() => {
        const calculateSunPosition = () => {
            const nowUtc = Date.now();
            const sunriseMs = sunrise * 1000;
            const sunsetMs = sunset * 1000;

            // Update current time label for the target city
            const currentTargetTime = new Date(nowUtc + (timezoneOffset * 1000));
            const hours = currentTargetTime.getUTCHours().toString().padStart(2, '0');
            const minutes = currentTargetTime.getUTCMinutes().toString().padStart(2, '0');
            setCurrentTimeLabel(`${hours}:${minutes}`);

            if (nowUtc < sunriseMs) {
                setSunPercentage(0);
                return;
            }
            if (nowUtc > sunsetMs) {
                setSunPercentage(100);
                return;
            }

            const totalDaylight = sunsetMs - sunriseMs;
            const timeSinceSunrise = nowUtc - sunriseMs;
            const percentage = (timeSinceSunrise / totalDaylight) * 100;
            
            setSunPercentage(percentage);
        };

        calculateSunPosition();
        const interval = setInterval(calculateSunPosition, 60000); // Update every minute

        return () => clearInterval(interval);
    }, [sunrise, sunset, timezoneOffset]);

    const angle = (1 - sunPercentage / 100) * Math.PI; // from PI to 0
    const sunX = 50 + Math.cos(angle) * 50;
    const sunY = Math.sin(angle) * 100;

    const pathLength = Math.PI * 90; // arc radius is 90
    const pathOffset = pathLength - (sunPercentage / 100) * pathLength;


    return (
        <div className={`rounded-3xl p-5 ${cardClass} animate-enter delay-200`}>
            <h3 className="text-sm font-medium text-gray-300 mb-6 px-1 uppercase tracking-wide">Ciclo Solar</h3>
            <div className="relative w-full max-w-sm mx-auto h-32 flex items-end justify-center overflow-hidden">
                
                <svg className="absolute bottom-6 w-full h-auto" viewBox="0 0 200 100">
                    <path d="M 10 90 A 90 90 0 0 1 190 90" fill="none" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="2" strokeDasharray="4 4"/>
                    {/* Sun Path with Glow */}
                    <path d="M 10 90 A 90 90 0 0 1 190 90" fill="none" stroke="#facc15" strokeWidth="3" strokeLinecap="round" style={{ strokeDasharray: pathLength, strokeDashoffset: pathOffset, transition: 'stroke-dashoffset 1s ease-in-out', filter: 'drop-shadow(0 0 4px rgba(250, 204, 21, 0.5))' }}/>
                </svg>

                <div 
                    className="absolute bottom-0 w-full h-1/2 transition-all duration-1000"
                    style={{ left: `${sunX}%`, bottom: `${sunY}%`, transform: 'translateX(-50%) translateY(50%)' }}
                >
                    <div className="relative flex flex-col items-center">
                        <div className="bg-yellow-400/20 p-2 rounded-full backdrop-blur-sm">
                             <SunIcon className="w-6 h-6 text-yellow-400 fill-yellow-400"/>
                        </div>
                        <span className="text-xs font-mono bg-black/60 border border-white/10 px-2 py-0.5 rounded text-white mt-1 shadow-lg">{currentTimeLabel}</span>
                    </div>
                </div>
            </div>
            
            <div className="flex justify-between items-center w-full max-w-sm mx-auto mt-2 px-4">
                <div className="flex flex-col items-start">
                     <div className="flex items-center gap-2 text-gray-400">
                        <SunriseIcon className="w-4 h-4" />
                        <span className="text-xs uppercase">Nascer</span>
                    </div>
                    <span className="font-bold text-lg">{formatTime(sunrise)}</span>
                </div>
                <div className="flex flex-col items-end">
                     <div className="flex items-center gap-2 text-gray-400">
                        <SunsetIcon className="w-4 h-4" />
                        <span className="text-xs uppercase">Pôr</span>
                    </div>
                    <span className="font-bold text-lg">{formatTime(sunset)}</span>
                </div>
            </div>
        </div>
    );
};

export default SunriseSunset;