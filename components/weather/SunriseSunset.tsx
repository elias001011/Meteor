import React, { useState, useEffect } from 'react';
import { SunriseIcon, SunsetIcon, SunIcon } from '../icons';

interface SunriseSunsetProps {
  sunrise: number;
  sunset: number;
}

const SunriseSunset: React.FC<SunriseSunsetProps> = ({ sunrise, sunset }) => {
    const [sunPosition, setSunPosition] = useState(0);

    useEffect(() => {
        const calculateSunPosition = () => {
            const now = Date.now();
            const sunriseMs = sunrise * 1000;
            const sunsetMs = sunset * 1000;

            if (now < sunriseMs) {
                setSunPosition(0);
                return;
            }
            if (now > sunsetMs) {
                setSunPosition(100);
                return;
            }

            const totalDaylight = sunsetMs - sunriseMs;
            const timeSinceSunrise = now - sunriseMs;
            const percentage = (timeSinceSunrise / totalDaylight) * 100;
            
            setSunPosition(percentage);
        };

        calculateSunPosition();
        const interval = setInterval(calculateSunPosition, 60000); // Update every minute

        return () => clearInterval(interval);
    }, [sunrise, sunset]);

    const formatTime = (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const rotation = -90 + (sunPosition * 1.8); // Map 0-100% to -90deg to 90deg

    return (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-3xl p-4">
            <h3 className="text-sm text-gray-400 mb-4 px-2">Nascer e Pôr do Sol</h3>
            <div className="relative w-full h-28 flex items-end justify-center">
                {/* Dashed arc path */}
                <svg className="absolute bottom-6 w-[90%] max-w-xs h-auto" viewBox="0 0 200 100">
                    <path
                        d="M 10 90 A 90 90 0 0 1 190 90"
                        fill="none"
                        stroke="rgba(107, 114, 128, 0.5)"
                        strokeWidth="2"
                        strokeDasharray="4 4"
                    />
                </svg>

                {/* Sun icon on its rotation axis */}
                <div 
                    className="absolute w-[90%] max-w-xs h-[45%] max-h-[11.25rem] bottom-6 transition-transform duration-1000"
                    style={{ transform: `rotate(${rotation}deg)`}}
                >
                    <div className="absolute -top-3 left-0 text-yellow-400">
                       <SunIcon className="w-6 h-6" />
                    </div>
                </div>
            </div>
            
            <div className="flex justify-between items-center w-[95%] max-w-sm mx-auto -mt-4">
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