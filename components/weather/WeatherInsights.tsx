

import React, { useMemo } from 'react';
import type { WeatherData, HourlyForecast, DailyForecast, AirQualityData } from '../../types';
import { useTheme } from '../context/ThemeContext';
import { getSettings } from '../../services/settingsService';

interface WeatherInsightsProps {
    current: WeatherData;
    hourly: HourlyForecast[];
    daily: DailyForecast[];
    airQuality?: AirQualityData | null;
}

interface AnalysisEvent {
    priority: number; 
    text: string;
    category: 'alert' | 'rain' | 'temp' | 'wind' | 'sun' | 'comfort' | 'lifestyle' | 'warning' | 'uv' | 'air';
}

const getRandomPhrase = (phrases: string[], seed: number) => {
    const index = (seed + phrases.length) % phrases.length; 
    return phrases[index];
};

const WeatherInsights: React.FC<WeatherInsightsProps> = ({ current, hourly, daily, airQuality }) => {
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
        const isAfternoon = hour >= 12 && hour < 18;
        const isEvening = hour >= 18 && hour < 22;
        const isNight = hour >= 22 || hour < 5;
        const seed = Math.floor(current.dt);

        const next3Hours = hourly.slice(0, 3);
        const tempNow = current.temperature;
        const feelsLike = current.feels_like || tempNow;
        const windSpeed = current.windSpeed;
        const humidity = current.humidity;
        const uvi = current.uvi;
        const aqi = airQuality?.aqi;
        const conditionLower = (current.condition || '').toLowerCase();
        
        const isRainingNow = conditionLower.match(/(chuv|rain|drizzle|garoa|aguaceiro)/);
        const isStorming = conditionLower.match(/(tempestade|trovoada|thunder|trovão)/);
        const isSnowing = conditionLower.match(/(neve|snow)/);
        const willRainSoon = next3Hours.some(h => (h.pop || 0) > 0.5);
        const willRainIn = willRainSoon ? next3Hours.findIndex(h => (h.pop || 0) > 0.5) + 1 : 0;

        // 1. TEMPESTADE - Prioridade maxima
        if (isStorming) {
            events.push({ priority: 1, category: 'alert', text: getRandomPhrase([
                "Tempestade em andamento. Fique em local seguro.", 
                "Raios e trovões detectados. Tire eletrônicos da tomada.",
                "Tempestade ativa! Evite áreas abertas."
            ], seed)});
        } 
        // 2. NEVASCA
        else if (isSnowing) {
            events.push({ priority: 1, category: 'warning', text: getRandomPhrase([
                "Nevando! Cuidado nas ruas, piso escorregadio.",
                "Queda de neve ativa. Use calçado adequado.",
                "Nevasca em andamento. Evite viagens."
            ], seed)});
        }
        // 3. CHUVA
        else if (isRainingNow) {
            events.push({ priority: 2, category: 'rain', text: getRandomPhrase([
                "Dia cinza e chuvoso.", 
                "Guarda-chuva é item obrigatório hoje.", 
                "Pistas molhadas e escorregadias.",
                "Chuva forte no momento. Reduza a velocidade.",
                "Precipitação intensa. Visibilidade reduzida."
            ], seed)});
        } else if (willRainSoon) {
            const timeMsg = willRainIn === 1 ? "na próxima hora" : `em ${willRainIn} horas`;
            events.push({ priority: 3, category: 'rain', text: `O tempo vai virar ${timeMsg}. Prepare o guarda-chuva.` });
        }

        // 4. UV ALTO
        if (uvi !== undefined && uvi >= 8 && !isNight) {
            events.push({ priority: 3, category: 'uv', text: getRandomPhrase([
                "Índice UV muito alto! Proteção solar essencial.",
                "Radiação solar intensa. Use óculos e chapéu.",
                "Sol forte! FPS 30 no mínimo, procure sombra."
            ], seed)});
        } else if (uvi !== undefined && uvi >= 6 && uvi < 8 && !isNight) {
            events.push({ priority: 4, category: 'uv', text: "Índice UV elevado. Protetor solar recomendado." });
        }

        // 5. AR RUIM
        if (aqi && aqi >= 4) {
            events.push({ priority: 3, category: 'air', text: getRandomPhrase([
                "Qualidade do ar ruim. Evite exercícios ao ar livre.",
                "Ar insalubre. Grupos sensíveis, fiquem em casa.",
                "Poluição elevada. Use máscara se precisar sair."
            ], seed)});
        } else if (aqi === 3) {
            events.push({ priority: 5, category: 'air', text: "Ar moderado. Sensíveis devem ter cuidado." });
        }

        // 6. TEMPERATURA EXTREMA
        if (feelsLike >= 35) {
            events.push({ priority: 2, category: 'temp', text: getRandomPhrase([
                "Calor infernal! Hidrate-se muito.", 
                "Sensação de forno ligado. Beba água!",
                `Onda de calor! ${Math.round(feelsLike)}°C de sensação. Evite sol.`
            ], seed)});
        } else if (feelsLike <= 5) {
            events.push({ priority: 2, category: 'temp', text: getRandomPhrase([
                "Frio congelante! Proteja-se bem.", 
                "Hoje é dia de edredom e sopa quente.",
                "Temperatura crítica. Camadas de roupa essenciais."
            ], seed)});
        }

        // 7. VENTO FORTE
        if (windSpeed >= 50) {
            events.push({ priority: 3, category: 'warning', text: getRandomPhrase([
                "Ventania! Cuidado com objetos soltos.",
                "Ventos muito fortes. Evite ficar perto de árvores.",
                "Rajadas intensas. Não estacione sob placas."
            ], seed)});
        } else if (windSpeed >= 30) {
            events.push({ priority: 6, category: 'wind', text: "Vento forte hoje. Proteja objetos leves." });
        }

        // 8. UMIDADE EXTREMA
        if (humidity >= 85 && tempNow > 20) {
            events.push({ priority: 5, category: 'comfort', text: "Ar muito úmido. Pode causar desconforto térmico." });
        } else if (humidity <= 25) {
            events.push({ priority: 6, category: 'comfort', text: "Ar seco. Hidrate a pele e beba água." });
        }

        // 9. AR BOM (positivo)
        if (aqi && aqi <= 2 && events.length === 0) {
            events.push({ priority: 10, category: 'air', text: getRandomPhrase([
                "Qualidade do ar excelente! Aproveite.",
                "Ar puro e limpo. Ótimo para atividades externas."
            ], seed)});
        }

        // 10. UV MODERADO (baixa prioridade)
        if (uvi !== undefined && uvi >= 3 && uvi < 6 && !isNight && events.length === 0) {
            events.push({ priority: 7, category: 'uv', text: "Índice UV moderado. Protetor útil para exposição longa." });
        }

        // 11. CLIMA PERFEITO ou BOM
        if (events.length === 0) {
            if (feelsLike >= 18 && feelsLike <= 26 && humidity >= 40 && humidity <= 60) {
                events.push({ priority: 10, category: 'lifestyle', text: getRandomPhrase([
                    "Clima absolutamente perfeito.", 
                    "O tempo está uma delícia lá fora.",
                    "Condições ideais! Aproveite o dia."
                ], seed)});
            } else if (isMorning) {
                events.push({ priority: 10, category: 'lifestyle', text: getRandomPhrase([
                    `Bom dia${userName}! Tempo estável.`, 
                    "Manhã calma lá fora.",
                    `Olá${userName}! Dia começando bem.`
                ], seed)});
            } else if (isAfternoon) {
                events.push({ priority: 10, category: 'lifestyle', text: getRandomPhrase([
                    "Tarde agradável. Aproveite!",
                    `Boa tarde${userName}! Tempo tranquilo.`,
                    "Dia segue estável por aqui."
                ], seed)});
            } else if (isEvening) {
                events.push({ priority: 10, category: 'lifestyle', text: getRandomPhrase([
                    `Boa noite${userName}! Noite agradável.`,
                    "Entardecer tranquilo. Bom descanso!",
                    "Noite chegando com tempo estável."
                ], seed)});
            } else {
                events.push({ priority: 10, category: 'lifestyle', text: getRandomPhrase([
                    "Tudo normal no clima.", 
                    `Dia tranquilo por aqui${userName}.`,
                    "Condições estáveis. Aproveite!"
                ], seed)});
            }
        }

        events.sort((a, b) => (a.priority - b.priority));
        const finalHighlight = events[0].text;

        // Recomendação contextual
        let recPhrase = "";
        if (isStorming) recPhrase = "Fique em casa até passar.";
        else if (isRainingNow) recPhrase = "Dirija com cautela e faróis baixos.";
        else if (willRainSoon) recPhrase = "Leve guarda-chuva se for sair.";
        else if (feelsLike > 30) recPhrase = "Beba bastante água.";
        else if (feelsLike < 10) recPhrase = "Agasalhe-se bem.";
        else if (uvi !== undefined && uvi >= 8) recPhrase = "Proteção solar é essencial.";
        else if (windSpeed >= 40) recPhrase = "Cuidado com o vento.";
        else if (isNight) recPhrase = "Bom descanso!";
        else recPhrase = "Aproveite o dia!";

        return { highlight: finalHighlight, recommendation: recPhrase };
    }, [current.dt, settings.userName, config.enabled, current.feels_like, current.temperature, current.windSpeed, current.humidity, current.uvi, airQuality?.aqi, hourly]);

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
