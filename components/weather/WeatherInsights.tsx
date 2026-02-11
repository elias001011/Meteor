

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

// Calcula índice de conforto térmico
const calculateComfortIndex = (temp: number, humidity: number): { level: string; emoji: string } => {
    if (temp >= 35) return { level: 'extreme_heat', emoji: '🔥' };
    if (temp >= 30) return { level: 'hot', emoji: '☀️' };
    if (temp <= 5) return { level: 'freezing', emoji: '❄️' };
    if (temp <= 15) return { level: 'cold', emoji: '🧥' };
    if (temp >= 18 && temp <= 26 && humidity >= 40 && humidity <= 60) {
        return { level: 'perfect', emoji: '✨' };
    }
    return { level: 'moderate', emoji: '🌤️' };
};

// Análise de UV retornando texto
const getUVText = (uvi: number | undefined, seed: number): string | null => {
    if (uvi === undefined) return null;
    
    if (uvi >= 11) {
        return getRandomPhrase([
            "☀️ UV EXTREMO! Evite sol 10h-16h. FPS 50+ obrigatório.",
            "🟣 Risco extremo de queimadura. Fique na sombra!"
        ], seed);
    }
    if (uvi >= 8) {
        return getRandomPhrase([
            "☀️ UV muito alto. Proteção solar essencial agora.",
            "🔴 Sol forte! Óculos e chapéu são obrigatórios."
        ], seed);
    }
    if (uvi >= 6) {
        return getRandomPhrase([
            "🟠 UV alto. Use protetor se for sair.",
            "☀️ Sol intenso. Busque sombra ao meio-dia."
        ], seed);
    }
    if (uvi >= 3) {
        return getRandomPhrase([
            "🟡 UV moderado. Protetor recomendado.",
            "⛅ Proteção solar preventiva para exposição longa."
        ], seed);
    }
    return null;
};

// Análise de Qualidade do Ar
const getAirQualityText = (aqi: number | undefined, seed: number): string | null => {
    if (aqi === undefined) return null;
    
    if (aqi === 5) {
        return getRandomPhrase([
            "😷 AR PERIGOSO! Evite sair. Use máscara N95.",
            "🟣 Emergência na qualidade do ar. Fique em casa!"
        ], seed);
    }
    if (aqi === 4) {
        return getRandomPhrase([
            "⚠️ Ar insalubre. Evite exercícios ao ar livre.",
            "🟠 Qualidade do ar ruim. Grupos sensíveis, cuidado!"
        ], seed);
    }
    if (aqi === 3) {
        return getRandomPhrase([
            "🟡 Ar moderado. Sensíveis devem reduzir atividades.",
            "💨 Qualidade aceitável, mas atenção para asmáticos."
        ], seed);
    }
    if (aqi === 1) {
        return getRandomPhrase([
            "🌿 Ar excelente! Aproveite atividades ao ar livre.",
            "💚 Qualidade do ar ótima. Respire fundo!"
        ], seed);
    }
    return null;
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

        const next6Hours = hourly.slice(0, 6);
        const tempNow = current.temperature;
        const feelsLike = current.feels_like ?? tempNow;
        const windSpeed = current.windSpeed;
        const humidity = current.humidity;
        const uvi = current.uvi;
        const aqi = airQuality?.aqi;
        const conditionLower = (current.condition || '').toLowerCase();
        
        const isRainingNow = /(chuv|rain|drizzle|garoa|aguaceiro)/.test(conditionLower);
        const isStorming = /(tempestade|trovoada|thunder|trovão)/.test(conditionLower);
        const isSnowing = /(neve|snow)/.test(conditionLower);
        const willRain = next6Hours.some(h => (h.pop || 0) > 0.5);
        const rainIntensity = next6Hours.reduce((acc, h) => Math.max(acc, h.pop || 0), 0);
        
        // 1. ALERTAS CRÍTICOS (Tempestade) - Prioridade 1
        if (isStorming) {
            events.push({ 
                priority: 1, 
                category: 'alert', 
                text: getRandomPhrase([
                    "⚡ Tempestade ativa! Fique em local fechado.",
                    "🌩️ Raios detectados. Tire eletrônicos da tomada!"
                ], seed)
            });
        }

        // 2. NEVASCA
        if (isSnowing) {
            events.push({ 
                priority: 1, 
                category: 'warning', 
                text: getRandomPhrase([
                    "❄️ Nevando agora. Cuidado nas ruas!",
                    "🌨️ Neve em andamento. Calçado adequado essencial."
                ], seed)
            });
        }

        // 3. AR PERIGOSO (AQI 5)
        if (aqi === 5) {
            const aqText = getAirQualityText(aqi, seed);
            if (aqText) events.push({ priority: 1, category: 'air', text: aqText });
        }

        // 4. UV EXTREMO
        if (uvi !== undefined && uvi >= 11 && !isNight) {
            const uvText = getUVText(uvi, seed);
            if (uvText) events.push({ priority: 2, category: 'uv', text: uvText });
        }

        // 5. CHUVA (Atual ou iminente)
        if (isRainingNow && !isStorming) {
            const msg = rainIntensity > 0.7 
                ? getRandomPhrase(["🌧️ Chuva forte agora. Reduza a velocidade.", "☔ Aguaceiro intenso. Cuidado ao dirigir!"], seed)
                : getRandomPhrase(["🌦️ Chuva moderada. Guarda-chuva necessário.", "☔ Dia chuvoso. Pistas molhadas!"], seed);
            events.push({ priority: 2, category: 'rain', text: msg });
        } else if (willRain && !isRainingNow) {
            const hoursUntilRain = next6Hours.findIndex(h => (h.pop || 0) > 0.5) + 1;
            const timeMsg = hoursUntilRain === 1 ? 'na próxima hora' : `em ${hoursUntilRain}h`;
            events.push({ 
                priority: 3, 
                category: 'rain', 
                text: `☔ Chuva prevista ${timeMsg}. Leve guarda-chuva!` 
            });
        }

        // 6. UV Alto (mas não extremo)
        if (uvi !== undefined && uvi >= 6 && uvi < 11 && !isNight) {
            const uvText = getUVText(uvi, seed);
            if (uvText) events.push({ priority: 3, category: 'uv', text: uvText });
        }

        // 7. AR MODERADO/RUIM (AQI 3-4)
        if (aqi && aqi >= 3 && aqi <= 4) {
            const aqText = getAirQualityText(aqi, seed);
            if (aqText) events.push({ priority: 3, category: 'air', text: aqText });
        }

        // 8. TEMPERATURA EXTREMA
        if (feelsLike >= 35) {
            events.push({ 
                priority: 2, 
                category: 'temp', 
                text: getRandomPhrase([
                    `🌡️ Calor extremo! ${Math.round(feelsLike)}°C de sensação. Hidrate-se!`,
                    "🔥 Sensação térmica elevada. Evite sol ao meio-dia."
                ], seed)
            });
        } else if (feelsLike >= 30) {
            events.push({ 
                priority: 4, 
                category: 'temp', 
                text: getRandomPhrase([
                    "🌡️ Dia quente. Beba bastante água!",
                    "☀️ Calor intenso. Roupas leves e claras."
                ], seed)
            });
        } else if (feelsLike <= 5) {
            events.push({ 
                priority: 2, 
                category: 'temp', 
                text: getRandomPhrase([
                    "❄️ Frio intenso! Proteja-se bem.",
                    "🧥 Temperatura baixa. Camadas de roupa!"
                ], seed)
            });
        } else if (feelsLike <= 10) {
            events.push({ 
                priority: 5, 
                category: 'temp', 
                text: getRandomPhrase([
                    "🥶 Dia friozinho. Ótimo para chocolate quente!",
                    "🧣 Clima gelado. Não esqueça o casaco!"
                ], seed)
            });
        }

        // 9. VENTO FORTE
        if (windSpeed >= 50) {
            events.push({ 
                priority: 3, 
                category: 'warning', 
                text: getRandomPhrase([
                    "💨 Ventania! Cuidado com objetos soltos.",
                    "🌬️ Ventos muito fortes. Evite ficar perto de árvores."
                ], seed)
            });
        } else if (windSpeed >= 30) {
            events.push({ 
                priority: 6, 
                category: 'wind', 
                text: getRandomPhrase([
                    "🍃 Vento forte hoje. Proteja objetos leves.",
                    "💨 Rajadas intensas. Atente-se ao dirigir."
                ], seed)
            });
        }

        // 10. UMIDADE EXTREMA
        if (humidity >= 85 && tempNow > 20) {
            events.push({ 
                priority: 5, 
                category: 'comfort', 
                text: getRandomPhrase([
                    "💧 Ar muito úmido. Pode causar desconforto.",
                    "🌫️ Umidade alta. Ambientes refrigerados ajudam."
                ], seed)
            });
        } else if (humidity <= 25) {
            events.push({ 
                priority: 6, 
                category: 'comfort', 
                text: getRandomPhrase([
                    "🏜️ Ar seco. Hidrate a pele e beba água!",
                    "💨 Umidade baixa. Use protetor labial."
                ], seed)
            });
        }

        // 11. UV MODERADO (menor prioridade)
        if (uvi !== undefined && uvi >= 3 && uvi < 6 && !isNight && events.length === 0) {
            const uvText = getUVText(uvi, seed);
            if (uvText) events.push({ priority: 7, category: 'uv', text: uvText });
        }

        // 12. AR BOM (AQI 1-2) - positivo
        if (aqi && aqi <= 2 && events.length === 0) {
            const aqText = getAirQualityText(aqi, seed);
            if (aqText) events.push({ priority: 10, category: 'air', text: aqText });
        }

        // 13. CLIMA PERFEITO (fallback positivo)
        if (events.length === 0) {
            const comfort = calculateComfortIndex(tempNow, humidity);
            if (comfort.level === 'perfect') {
                let timeMsg = '';
                if (isMorning) timeMsg = 'Bom dia' + userName + '! ☕';
                else if (isAfternoon) timeMsg = 'Boa tarde' + userName + '! 🌤️';
                else if (isEvening) timeMsg = 'Boa noite' + userName + '! 🌅';
                else timeMsg = 'Olá' + userName + '! 🌟';
                
                events.push({ 
                    priority: 10, 
                    category: 'lifestyle', 
                    text: `${timeMsg} ${comfort.emoji} Clima perfeito hoje!` 
                });
            } else {
                // Mensagem genérica por horário
                let greeting = '';
                if (isMorning) greeting = `Bom dia${userName}! ☕ Tempo estável.`;
                else if (isAfternoon) greeting = `Boa tarde${userName}! 🌤️ Dia tranquilo.`;
                else if (isEvening) greeting = `Boa noite${userName}! 🌙 Boa noite!`;
                else greeting = `Olá${userName}! 🌟 Noite calma.`;
                
                events.push({ priority: 10, category: 'lifestyle', text: greeting });
            }
        }

        events.sort((a, b) => (a.priority - b.priority));
        const finalHighlight = events[0].text;

        // Recomendação contextual baseada na situação
        let recPhrase = '';
        if (isStorming) recPhrase = "Fique em casa até passar a tempestade.";
        else if (isRainingNow) recPhrase = "Dirija com cautela e faróis baixos.";
        else if (willRain) recPhrase = "Leve guarda-chuva se for sair hoje.";
        else if (feelsLike >= 35) recPhrase = "Hidrate-se constantemente!";
        else if (feelsLike <= 5) recPhrase = "Roupa em camadas é a melhor opção.";
        else if (uvi !== undefined && uvi >= 8) recPhrase = "Proteção solar reforçada hoje.";
        else if (aqi === 5) recPhrase = "Evite atividades ao ar livre.";
        else if (windSpeed >= 40) recPhrase = "Cuidado com objetos soltos ao ar livre.";
        else if (isNight) recPhrase = "Bom descanso!";
        else if (isMorning) recPhrase = "Ótimo dia para começar!";
        else recPhrase = "Aproveite o dia!";

        return { highlight: finalHighlight, recommendation: recPhrase };
    }, [current.dt, current.temperature, current.feels_like, current.windSpeed, current.humidity, current.uvi, airQuality?.aqi, settings.userName, config.enabled, hourly]);

    if (!config.enabled) return null;

    const isContainerStyle = config.style === 'container';
    const showHighlight = (config.content === 'highlight' || config.content === 'both') && highlight;
    const showRecommendation = (config.content === 'recommendation' || config.content === 'both') && recommendation;

    if (!showHighlight && !showRecommendation) return null;

    const PulseIndicator = () => {
        if (!config.showPulse) return null;
        const isCritical = highlight.includes("Tempestade") || 
                          highlight.includes("EXTREMO") || 
                          highlight.includes("perigoso") ||
                          highlight.includes("PERIGOSO");
        const pulseColor = isCritical ? "bg-red-500" : classes.bg;
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
