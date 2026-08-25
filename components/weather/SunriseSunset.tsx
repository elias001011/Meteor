
import React, { useEffect, useMemo, useState } from 'react';
import { SunriseIcon, SunsetIcon, SunIcon } from '../icons';
import { useTheme } from '../context/ThemeContext';

interface SunriseSunsetProps {
  sunrise: number;
  sunset: number;
  timezoneOffset?: number;
}

const SunriseSunset: React.FC<SunriseSunsetProps> = ({ sunrise, sunset, timezoneOffset = 0 }) => {
    const [sunPercentage, setSunPercentage] = useState(0);
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

    const daylight = useMemo(() => {
        const minutes = Math.max(0, Math.round((sunset - sunrise) / 60));
        return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}min`;
    }, [sunrise, sunset]);

    return (
        <section className={`rounded-2xl p-4 sm:p-5 ${cardClass} animate-enter`} aria-labelledby="solar-title">
            <div className="mb-3 flex items-center justify-between">
                <h3 id="solar-title" className="text-sm font-semibold text-white">Sol e luz do dia</h3>
                <SunIcon className="h-4 w-4 text-amber-300" />
            </div>

            <div className="relative mb-4 h-1.5 rounded-full bg-white/[0.08]" aria-hidden="true">
                <span className="absolute inset-y-0 left-0 rounded-full bg-amber-300/70" style={{ width: `${sunPercentage}%` }} />
                <span
                    className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#111419] bg-amber-300"
                    style={{ left: `${Math.min(99, Math.max(1, sunPercentage))}%` }}
                />
            </div>

            <div className="grid grid-cols-3 divide-x divide-white/[0.07]">
                <div className="pr-3">
                    <p className="flex items-center gap-1.5 text-[11px] text-slate-500"><SunriseIcon className="h-3.5 w-3.5" /> Nascer</p>
                    <p className="mt-1 text-sm font-semibold tabular-nums text-slate-200">{formatTime(sunrise)}</p>
                </div>
                <div className="px-3 text-center">
                    <p className="text-[11px] text-slate-500">Luz do dia</p>
                    <p className="mt-1 whitespace-nowrap text-sm font-semibold tabular-nums text-slate-200">{daylight}</p>
                </div>
                <div className="pl-3 text-right">
                    <p className="flex items-center justify-end gap-1.5 text-[11px] text-slate-500">Pôr <SunsetIcon className="h-3.5 w-3.5" /></p>
                    <p className="mt-1 text-sm font-semibold tabular-nums text-slate-200">{formatTime(sunset)}</p>
                </div>
            </div>
        </section>
    );
};

export default SunriseSunset;
