

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

// Analise de UV retornando texto
const getUVText = (uvi: number | undefined, seed: number): string | null => {
    if (uvi === undefined) return null;
    
    if (uvi >= 11) {
        return getRandomPhrase([
            "UV EXTREMO! Evite sol das 10h as 16h. FPS 50+, oculos e chapeu sao essenciais.",
            "Risco extremo de queimadura solar. Fique na sombra e proteja a pele!",
            "Indice UV critico. Exposicao ao sol e perigosa neste momento."
        ], seed);
    }
    if (uvi >= 8) {
        return getRandomPhrase([
            "UV muito alto. Protecao solar essencial, limite a exposicao ao sol.",
            "Sol intenso! Use oculos escuros, chapeu e protetor solar reforcado.",
            "Indice UV elevado. Evite permanecer ao sol por longos periodos."
        ], seed);
    }
    if (uvi >= 6) {
        return getRandomPhrase([
            "UV alto. Use protetor solar e busque sombra durante o pico solar.",
            "Radiacao solar significativa. Protecao recomendada para pele e olhos.",
            "Sol forte. Nao esqueca o protetor se for sair agora."
        ], seed);
    }
    if (uvi >= 3) {
        return getRandomPhrase([
            "UV moderado. Protetor solar recomendado para exposicao prolongada.",
            "Radiacao solar moderada. Protecao preventiva e uma boa ideia.",
            "Indice UV baixo a moderado. Protetor e util para exposicao longa."
        ], seed);
    }
    return null;
};

// Analise de Qualidade do Ar
const getAirQualityText = (aqi: number | undefined, seed: number): string | null => {
    if (aqi === undefined) return null;
    
    if (aqi === 5) {
        return getRandomPhrase([
            "AR PERIGOSO! Evite sair. Se necessario, use mascara N95.",
            "Emergencia na qualidade do ar. Fique em ambiente fechado!",
            "Poluicao extrema. Todos podem sentir efeitos graves na saude."
        ], seed);
    }
    if (aqi === 4) {
        return getRandomPhrase([
            "Ar insalubre. Evite exercicios ao ar livre e reduza atividades.",
            "Qualidade do ar ruim. Grupos sensiveis devem ficar em casa.",
            "Poluicao elevada. Sintomas respiratorios podem aparecer."
        ], seed);
    }
    if (aqi === 3) {
        return getRandomPhrase([
            "Ar moderado. Pessoas sensiveis devem reduzir atividades intensas.",
            "Qualidade aceitavel, mas atencao para quem tem problemas respiratorios.",
            "Poluicao leve a moderada. Asmaticos e idosos, cuidado redobrado."
        ], seed);
    }
    if (aqi === 2) {
        return getRandomPhrase([
            "Qualidade do ar boa. Condicoes adequadas para atividades ao ar livre.",
            "Ar de boa qualidade. Aproveite para atividades externas.",
            "Poluicao baixa. Bom momento para caminhadas e exercicios."
        ], seed);
    }
    if (aqi === 1) {
        return getRandomPhrase([
            "Ar excelente! Aproveite atividades ao ar livre sem preocupacoes.",
            "Qualidade do ar otima. Respire fundo e aproveite o dia!",
            "Purificacao do ar em niveis excelentes. Perfeito para atividades externas."
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
        
        const isRainingNow = conditionLower.includes('chuv') || conditionLower.includes('rain') || conditionLower.includes('drizzle') || conditionLower.includes('garoa');
        const isStorming = conditionLower.includes('tempestade') || conditionLower.includes('trovoada') || conditionLower.includes('thunder');
        const isSnowing = conditionLower.includes('neve') || conditionLower.includes('snow');
        const willRain = next6Hours.some(h => (h.pop || 0) > 0.5);
        const rainIntensity = next6Hours.reduce((acc, h) => Math.max(acc, h.pop || 0), 0);
        
        // 1. ALERTAS CRITICOS (Tempestade) - Prioridade 1
        if (isStorming) {
            events.push({ 
                priority: 1, 
                category: 'alert', 
                text: getRandomPhrase([
                    "Tempestade ativa! Fique em local fechado ate passar.",
                    "Raios e trovoes detectados. Tire eletronicos da tomada!",
                    "Tempestade em andamento. Evite areas abertas e arvores."
                ], seed)
            });
        }

        // 2. NEVASCA
        if (isSnowing) {
            events.push({ 
                priority: 1, 
                category: 'warning', 
                text: getRandomPhrase([
                    "Nevando agora. Cuidado nas ruas, pavimento escorregadio!",
                    "Neve em andamento. Use calcado adequado e dirija com atencao.",
                    "Queda de neve ativa. Evite viagens desnecessarias."
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
                ? getRandomPhrase([
                    "Chuva forte no momento. Reduza a velocidade se estiver dirigindo.",
                    "Aguaceiro intenso. Visibilidade reduzida, atencao nas estradas!",
                    "Chuva pesada caindo. Evite sair se nao for necessario."
                ], seed)
                : getRandomPhrase([
                    "Chuva moderada. Guarda-chuva e essencial se for sair.",
                    "Dia chuvoso. Pistas molhadas, aumente a distancia do carro da frente.",
                    "Precipitacao em andamento. Leve capa ou guarda-chuva."
                ], seed);
            events.push({ priority: 2, category: 'rain', text: msg });
        } else if (willRain && !isRainingNow) {
            const hoursUntilRain = next6Hours.findIndex(h => (h.pop || 0) > 0.5) + 1;
            const timeMsg = hoursUntilRain === 1 ? 'na proxima hora' : `em ${hoursUntilRain} horas`;
            events.push({ 
                priority: 3, 
                category: 'rain', 
                text: `Chuva prevista ${timeMsg}. Leve guarda-chuva se for sair!` 
            });
        }

        // 6. UV Alto (mas nao extremo)
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
                    `Calor extremo! ${Math.round(feelsLike)} graus de sensacao. Hidrate-se constantemente!`,
                    "Sensacao termica elevada. Evite exposicao ao sol das 10h as 16h.",
                    "Onda de calor. Beba agua a cada 20 minutos, mesmo sem sede."
                ], seed)
            });
        } else if (feelsLike >= 30) {
            events.push({ 
                priority: 4, 
                category: 'temp', 
                text: getRandomPhrase([
                    "Dia quente. Beba bastante agua e use roupas leves e claras.",
                    "Calor intenso. Procure ambientes refrigerados para descansar.",
                    "Temperatura elevada. Evite exercicios ao meio-dia."
                ], seed)
            });
        } else if (feelsLike <= 5) {
            events.push({ 
                priority: 2, 
                category: 'temp', 
                text: getRandomPhrase([
                    "Frio intenso! Proteja-se bem com varias camadas de roupa.",
                    "Temperatura baixa. Use gorro e luvas se for sair.",
                    "Dia gelado. Cuidado com hipotermia em exposicao prolongada."
                ], seed)
            });
        } else if (feelsLike <= 10) {
            events.push({ 
                priority: 5, 
                category: 'temp', 
                text: getRandomPhrase([
                    "Dia friozinho. Otimo para chocolate quente e cobertor!",
                    "Clima gelado. Nao esqueca o casaco ao sair.",
                    "Temperatura baixa. Roupa em camadas e a melhor opcao."
                ], seed)
            });
        }

        // 9. VENTO FORTE
        if (windSpeed >= 50) {
            events.push({ 
                priority: 3, 
                category: 'warning', 
                text: getRandomPhrase([
                    "Ventania! Cuidado com objetos soltos e evite ficar perto de arvores.",
                    "Ventos muito fortes. Nao estacione sob arvores ou placas.",
                    "Rajadas intensas. Evite sair a menos que seja emergencia."
                ], seed)
            });
        } else if (windSpeed >= 30) {
            events.push({ 
                priority: 6, 
                category: 'wind', 
                text: getRandomPhrase([
                    "Vento forte hoje. Protega objetos leves no quintal.",
                    "Rajadas intensas. Atencao ao dirigir, especialmente em pontes.",
                    "Ventania moderada. Cuidado com porta de carro ao abrir."
                ], seed)
            });
        }

        // 10. UMIDADE EXTREMA
        if (humidity >= 85 && tempNow > 20) {
            events.push({ 
                priority: 5, 
                category: 'comfort', 
                text: getRandomPhrase([
                    "Ar muito umido. Pode causar desconforto termico.",
                    "Umidade alta. Ventiladores ou ar condicionado ajudam.",
                    "Sensacao de abafamento. Procure ambientes ventilados."
                ], seed)
            });
        } else if (humidity <= 25) {
            events.push({ 
                priority: 6, 
                category: 'comfort', 
                text: getRandomPhrase([
                    "Ar muito seco. Hidrate a pele e beba bastante agua!",
                    "Umidade baixa. Use protetor labial e creme hidratante.",
                    "Desidratacao e mais facil. Aumente a ingestao de liquidos."
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
            if (feelsLike >= 18 && feelsLike <= 26 && humidity >= 40 && humidity <= 60) {
                let timeMsg = '';
                if (isMorning) timeMsg = 'Bom dia' + userName + '!';
                else if (isAfternoon) timeMsg = 'Boa tarde' + userName + '!';
                else if (isEvening) timeMsg = 'Boa noite' + userName + '!';
                else timeMsg = 'Ola' + userName + '!';
                
                events.push({ 
                    priority: 10, 
                    category: 'lifestyle', 
                    text: `${timeMsg} Clima perfeito hoje, aproveite!` 
                });
            } else {
                // Mensagem generica por horario
                let greeting = '';
                if (isMorning) greeting = `Bom dia${userName}! Tempo estavel.`;
                else if (isAfternoon) greeting = `Boa tarde${userName}! Dia tranquilo.`;
                else if (isEvening) greeting = `Boa noite${userName}! Boa noite!`;
                else greeting = `Ola${userName}! Noite calma.`;
                
                events.push({ priority: 10, category: 'lifestyle', text: greeting });
            }
        }

        events.sort((a, b) => (a.priority - b.priority));
        const finalHighlight = events[0].text;

        // Recomendacao contextual baseada na situacao
        let recPhrase = '';
        if (isStorming) recPhrase = "Fique em casa ate passar a tempestade.";
        else if (isRainingNow) recPhrase = "Dirija com cautela e mantenha distancia dos outros veiculos.";
        else if (willRain) recPhrase = "Leve guarda-chuva se for sair hoje.";
        else if (feelsLike >= 35) recPhrase = "Hidrate-se constantemente, beba agua mesmo sem sede.";
        else if (feelsLike <= 5) recPhrase = "Roupa em camadas e a melhor opcao para o frio.";
        else if (uvi !== undefined && uvi >= 8) recPhrase = "Protecao solar reforcada e essencial hoje.";
        else if (aqi === 5) recPhrase = "Evite atividades ao ar livre ate melhorar a qualidade do ar.";
        else if (windSpeed >= 40) recPhrase = "Cuidado com objetos soltos ao ar livre.";
        else if (isNight) recPhrase = "Bom descanso!";
        else if (isMorning) recPhrase = "Otimas condicoes para comecar o dia!";
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
        const isCritical = highlight.toLowerCase().includes("tempestade") || 
                          highlight.toLowerCase().includes("perigoso") ||
                          highlight.toLowerCase().includes("extremo") ||
                          highlight.toLowerCase().includes("critico");
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
