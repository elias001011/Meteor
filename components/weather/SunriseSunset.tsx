import React, { useState, useEffect } from 'react';
import { SunriseIcon, SunsetIcon, SunIcon } from '../icons';

interface SunriseSunsetProps {
  sunrise: number;
  sunset: number;
}

const SunriseSunset: React.FC<SunriseSunsetProps> = ({ sunrise, sunset }) => {
    const [sunPercentage, setSunPercentage] = useState(0);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const calculateSunPosition = () => {
            const now = Date.now();
            setCurrentTime(new Date(now));
            const sunriseMs = sunrise * 1000;
            const sunsetMs = sunset * 1000;

            if (now < sunriseMs) {
                setSunPercentage(0);
                return;
            }
            if (now > sunsetMs) {
                setSunPercentage(100);
                return;
            }

            const totalDaylight = sunsetMs - sunriseMs;
            const timeSinceSunrise = now - sunriseMs;
            const percentage = (timeSinceSunrise / totalDaylight) * 100;
            
            setSunPercentage(percentage);
        };

        calculateSunPosition();
        const interval = setInterval(calculateSunPosition, 60000); // Update every minute

        return () => clearInterval(interval);
    }, [sunrise, sunset]);

    const formatTime = (timestamp: number | Date) => {
        const date = typeof timestamp === 'number' ? new Date(timestamp * 1000) : timestamp;
        return date.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const angle = (1 - sunPercentage / 100) * Math.PI; // from PI to 0
    const sunX = 50 + Math.cos(angle) * 50;
    const sunY = Math.sin(angle) * 100;

    const pathLength = Math.PI * 90; // arc radius is 90
    const pathOffset = pathLength - (sunPercentage / 100) * pathLength;


    return (
        <div className="bg-gray-800 rounded-3xl p-4">
            <h3 className="text-sm text-gray-400 mb-4 px-2">Nascer e Pôr do Sol</h3>
            <div className="relative w-full max-w-sm mx-auto h-28 flex items-end justify-center">
                
                <svg className="absolute bottom-6 w-full h-auto" viewBox="0 0 200 100">
                    <path d="M 10 90 A 90 90 0 0 1 190 90" fill="none" stroke="rgba(107, 114, 128, 0.5)" strokeWidth="2" strokeDasharray="4 4"/>
                    <path d="M 10 90 A 90 90 0 0 1 190 90" fill="none" stroke="#facc15" strokeWidth="2" strokeLinecap="round" style={{ strokeDasharray: pathLength, strokeDashoffset: pathOffset, transition: 'stroke-dashoffset 1s ease-in-out' }}/>
                </svg>

                <div 
                    className="absolute bottom-0 w-full h-1/2 transition-all duration-1000"
                    style={{ left: `${sunX}%`, bottom: `${sunY}%`, transform: 'translateX(-50%) translateY(50%)' }}
                >
                    <div className="relative flex flex-col items-center">
                        <SunIcon className="w-6 h-6 text-yellow-400"/>
                        <span className="text-xs font-mono bg-gray-900/50 px-1 rounded mt-1">{formatTime(currentTime)}</span>
                    </div>
                </div>
            </div>
            
            <div className="flex justify-between items-center w-full max-w-sm mx-auto mt-1">
                <div className="flex items-center gap-2">
                    <SunriseIcon className="w-5 h-5 text-gray-400" />
                    <span className="font-bold">{formatTime(sunrise)}</span>
                </div>
                <div className="flex items-center gap-2">
                    <SunsetIcon className="w-5 h-5 text-gray-400" />
                    <span className="font-bold">{formatTime(sunset)}</span>
                </div>
            </div>
        </div>
    );
};

export default SunriseSunset;
