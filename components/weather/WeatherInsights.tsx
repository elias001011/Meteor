
import React, { useMemo } from 'react';
import type { WeatherData, HourlyForecast, DailyForecast } from '../../types';
import { useTheme } from '../context/ThemeContext';
import { getSettings } from '../../services/settingsService';

interface WeatherInsightsProps {
    current: WeatherData;
    hourly: HourlyForecast[];
    daily: DailyForecast[];
}

interface AnalysisEvent {
    priority: number; // 1 (Critical) to 4 (Casual)
    text: string;
    type: 'rain' | 'temp' | 'sun' | 'comfort' | 'wind' | 'warning' | 'general';
}

const getRandomPhrase = (phrases: string[]) => {
    const index = Math.floor(Math.random() * phrases.length);
    return phrases[index];
};

const WeatherInsights: React.FC<WeatherInsightsProps> = ({ current, hourly, daily }) => {
    const { classes, cardClass, density } = useTheme();
    const settings = getSettings();
    const config = settings.weatherInsights;

    if (!config.enabled) return null;

    const { highlight, recommendation } = useMemo(() => {
        const events: AnalysisEvent[] = [];
        const userName = settings.userName ? `, ${settings.userName}` : '';

        const nextHour = hourly[0];
        const secondHour = hourly[1];
        const isRainingNow = (current.rain_1h && current.rain_1h > 0) || 
                             (current.condition || '').toLowerCase().match(/(chuv|rain|drizzle|garoa)/);
        
        const currentTemp = current.feels_like || current.temperature;

        // --- LOGIC (Simplified for brevity, same as previous) ---
        // 1. RAIN
        if (isRainingNow) {
            if (nextHour && nextHour.pop !== undefined && nextHour.pop < 0.2) {
                events.push({ priority: 1, text: getRandomPhrase(["A chuva deve dar uma trégua em breve.", "Parece que a chuva vai parar na próxima hora."]), type: 'rain' });
            } else {
                 events.push({ priority: 2, text: getRandomPhrase(["Chuva contínua. Mantenha-se seco.", "A chuva segue firme por enquanto."]), type: 'rain' });
            }
        } else {
             if (nextHour && nextHour.pop !== undefined && nextHour.pop > 0.6) {
                 events.push({ priority: 1, text: getRandomPhrase(["Atenção: Chuva chegando na próxima hora!", "Feche as janelas, vem chuva por aí."]), type: 'rain' });
             } else if (secondHour && secondHour.pop !== undefined && secondHour.pop > 0.7) {
                 events.push({ priority: 2, text: getRandomPhrase(["Alta chance de chuva nas próximas horas.", "O céu deve fechar logo mais."]), type: 'rain' });
             }
        }

        // 2. EXTREME
        if (current.uvi && current.uvi >= 8) events.push({ priority: 1, text: "Índice UV Extremo! Proteja-se do sol.", type: 'warning' });
        
        // 3. GENERAL (Fallback)
        if (events.length === 0) {
            if (currentTemp > 28) events.push({ priority: 4, text: getRandomPhrase(["Um belo dia de calor.", "O sol brilha forte."]), type: 'temp' });
            else if (currentTemp < 15) events.push({ priority: 4, text: getRandomPhrase(["Dia frio e calmo.", "Clima fresco e agradável."]), type: 'temp' });
            else events.push({ priority: 4, text: getRandomPhrase(["Condições estáveis no momento.", "Tudo tranquilo com o tempo."]), type: 'general' });
        }

        events.sort((a, b) => a.priority - b.priority);
        const finalHighlight = events[0].text;

        // Rec logic (Simplified)
        let recPhrase = "";
        if (currentTemp >= 30) recPhrase = getRandomPhrase([`Evite exercícios ao ar livre${userName}.`, "Hidrate-se bem."]);
        else if (currentTemp <= 10) recPhrase = getRandomPhrase([`Se agasalhe bem${userName}.`, "Evite friagem."]);
        else recPhrase = getRandomPhrase(["Aproveite o dia.", "Ótimo para atividades leves."]);

        return { highlight: finalHighlight, recommendation: recPhrase };
    }, [current, hourly, daily, settings.userName]);

    const isContainerStyle = config.style === 'container';
    const showHighlight = (config.content === 'highlight' || config.content === 'both') && highlight;
    const showRecommendation = (config.content === 'recommendation' || config.content === 'both') && recommendation;

    if (!showHighlight && !showRecommendation) return null;

    // Helper for Pulse - Returns NULL if disabled
    const PulseIndicator = () => {
        if (!config.showPulse) return null;
        return (
            <span className="relative flex h-3 w-3 mr-2 mt-1.5 flex-shrink-0">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${classes.bg} opacity-75`}></span>
                <span className={`relative inline-flex rounded-full h-3 w-3 ${classes.bg}`}></span>
            </span>
        );
    };

    if (isContainerStyle) {
        return (
            <div className={`rounded-3xl ${density.padding} ${cardClass} animate-enter`}>
                <div className="flex flex-col gap-2">
                    {showHighlight && (
                        <div>
                            <h3 className={`${density.sectionTitle} font-bold text-white mb-1 flex items-start`}>
                                <PulseIndicator />
                                <span>{highlight}</span>
                            </h3>
                        </div>
                    )}
                    {showHighlight && showRecommendation && <div className="h-[1px] bg-white/10 w-full my-1" />}
                    {showRecommendation && <p className={`${density.text} text-gray-300 leading-relaxed`}>{recommendation}</p>}
                </div>
            </div>
        );
    } else {
        // CLEAN STYLE
        return (
            <div className={`px-2 py-4 animate-enter flex flex-col gap-2`}>
                 {showHighlight && (
                    <h3 className={`text-xl md:text-2xl font-bold text-white tracking-tight drop-shadow-md flex items-start`}>
                         <PulseIndicator />
                         <span>{highlight}</span>
                    </h3>
                )}
                {showRecommendation && (
                     <p className={`text-base font-medium text-gray-200 drop-shadow-sm opacity-90 ${config.showPulse ? 'pl-5' : ''} leading-relaxed`}>
                        {recommendation}
                    </p>
                )}
            </div>
        );
    }
};

export default WeatherInsights;
