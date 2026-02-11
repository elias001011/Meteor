
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
    priority: number; 
    text: string;
    category: 'alert' | 'rain' | 'temp' | 'wind' | 'sun' | 'comfort' | 'lifestyle' | 'warning';
}

const getRandomPhrase = (phrases: string[], seed: number) => {
    const index = (seed + phrases.length) % phrases.length; 
    return phrases[index];
};

const WeatherInsights: React.FC<WeatherInsightsProps> = ({ current, hourly, daily }) => {
    const { classes, cardClass, density, isPerformanceMode } = useTheme();
    const settings = getSettings();
    const config = settings.weatherInsights;

    const { highlight, recommendation } = useMemo(() => {
        if (!config.enabled) return { highlight: '', recommendation: '' };

        const events: AnalysisEvent[] = [];
        const userName = settings.userName ? ` ${settings.userName}` : '';
        const now = new Date();
        const hour = now.getHours();
        const isMorning = hour >= 5 && hour < 12;
        const isNight = hour >= 22 || hour < 5;
        const seed = Math.floor(current.dt);

        const next3Hours = hourly.slice(0, 3);
        const tempNow = current.temperature;
        const feelsLike = current.feels_like || tempNow;
        const windSpeed = current.windSpeed;
        const humidity = current.humidity;
        const conditionLower = (current.condition || '').toLowerCase();
        
        const isRainingNow = conditionLower.match(/(chuv|rain|drizzle|garoa|aguaceiro)/);
        const isStorming = conditionLower.match(/(tempestade|trovoada|thunder|trovão)/);
        const willRainSoon = next3Hours.some(h => (h.pop || 0) > 0.6);

        if (isStorming) {
            events.push({ priority: 1, category: 'alert', text: getRandomPhrase(["Tempestade em andamento. Fique em local seguro.", "Raios e trovões detectados. Tire eletrônicos da tomada."], seed)});
        } else if (isRainingNow) {
            events.push({ priority: 2, category: 'rain', text: getRandomPhrase(["Dia cinza e chuvoso.", "Guarda-chuva é item obrigatório hoje.", "Pistas molhadas e escorregadias."], seed)});
        } else if (willRainSoon) {
            events.push({ priority: 2, category: 'rain', text: getRandomPhrase(["O tempo vai virar nas próximas horas.", "Vem água por aí, prepare o guarda-chuva."], seed)});
        }

        if (feelsLike >= 35) {
            events.push({ priority: 2, category: 'temp', text: getRandomPhrase(["Calor infernal! Hidrate-se muito.", "Sensação de forno ligado."], seed)});
        } else if (feelsLike <= 5) {
            events.push({ priority: 2, category: 'temp', text: getRandomPhrase(["Frio congelante! Proteja-se.", "Hoje é dia de edredom e sopa."], seed)});
        }

        if (events.length === 0) {
            if (feelsLike >= 18 && feelsLike <= 26) {
                events.push({ priority: 5, category: 'lifestyle', text: getRandomPhrase(["Clima absolutamente perfeito.", "O tempo está uma delícia lá fora."], seed)});
            } else if (isMorning) {
                events.push({ priority: 5, category: 'lifestyle', text: getRandomPhrase([`Bom dia${userName}! Tempo estável.`, "Manhã calma lá fora."], seed)});
            } else {
                events.push({ priority: 5, category: 'lifestyle', text: getRandomPhrase(["Tudo normal no clima.", `Dia tranquilo por aqui${userName}.`], seed)});
            }
        }

        events.sort((a, b) => (a.priority - b.priority));
        const finalHighlight = events[0].text;

        let recPhrase = isRainingNow ? "Dirija com cautela e faróis baixos." : (feelsLike > 30 ? "Beba bastante água." : (isNight ? "Bom descanso!" : "Aproveite o dia!"));

        return { highlight: finalHighlight, recommendation: recPhrase };
    }, [current.dt, settings.userName, config.enabled]);

    if (!config.enabled) return null;

    const isContainerStyle = config.style === 'container';
    const showHighlight = (config.content === 'highlight' || config.content === 'both') && highlight;
    const showRecommendation = (config.content === 'recommendation' || config.content === 'both') && recommendation;

    if (!showHighlight && !showRecommendation) return null;

    const PulseIndicator = () => {
        if (!config.showPulse) return null;
        const pulseColor = highlight.includes("Tempestade") || highlight.includes("Perigo") ? "bg-red-500" : classes.bg;
        return (
            <span className="relative flex h-2.5 w-2.5 mr-2 self-center flex-shrink-0">
                {!settings.reducedMotion && !isPerformanceMode && (
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${pulseColor} opacity-75`}></span>
                )}
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${pulseColor}`}></span>
            </span>
        );
    };

    if (isContainerStyle) {
        return (
            <div className={`rounded-3xl ${density.padding} ${cardClass} animate-enter`}>
                <div className="flex flex-col gap-2">
                    {showHighlight && (
                        <h3 className={`${density.sectionTitle} font-bold text-white mb-1 flex items-baseline leading-snug`}>
                            <PulseIndicator />
                            <span>{highlight}</span>
                        </h3>
                    )}
                    {showHighlight && showRecommendation && <div className="h-[1px] bg-white/5 w-full my-1" />}
                    {showRecommendation && <p className={`${density.text} text-gray-400 leading-relaxed`}>{recommendation}</p>}
                </div>
            </div>
        );
    } else {
        return (
            <div className={`px-2 py-4 animate-enter flex flex-col gap-1`}>
                 {showHighlight && (
                    <h3 className={`text-xl font-bold text-white tracking-tight flex items-baseline`}>
                         <PulseIndicator />
                         <span>{highlight}</span>
                    </h3>
                )}
                {showRecommendation && (
                     <p className={`text-sm font-medium text-gray-300 opacity-80 ${config.showPulse ? 'pl-5' : ''}`}>
                        {recommendation}
                    </p>
                )}
            </div>
        );
    }
};

export default WeatherInsights;
