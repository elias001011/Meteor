
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
    category: 'alert' | 'rain' | 'temp' | 'lifestyle' | 'air';
}

// Sistema de frases expansível e variável
const FRASES = {
    tempestade: [
        "Tempestade em andamento. Fique em local seguro.",
        "Raios e trovões detectados. Tire eletrônicos da tomada.",
        "Tempestade ativa! Evite áreas abertas.",
        "Céu carregado com atividade elétrica. Prefira ficar em casa.",
        "Trovoada intensa no momento. Cuidado com quedas de energia.",
        "Condições severas de tempestade. Aguarde dentro de casa.",
        "Raios frequentes na região. Evite tocar em metais.",
        "Tempestade elétrica ativa. Mantenha-se afastado de janelas."
    ],
    chuvaForte: [
        "Dia cinza e chuvoso.",
        "Guarda-chuva é item obrigatório hoje.",
        "Pistas molhadas e escorregadias.",
        "Chuva forte no momento. Reduza a velocidade.",
        "Precipitação intensa. Visibilidade reduzida.",
        "Água caindo forte lá fora. Leve proteção!",
        "Chuva persistente. Ótimo dia para um bom café.",
        "Granizo ou chuva volumosa. Cuidado ao dirigir.",
        "Tempo instável com chuva significativa.",
        "Dia de manter o guarda-chuva sempre à mão."
    ],
    vaiChover: [
        "O tempo vai virar nas próximas horas.",
        "Vem água por aí, prepare o guarda-chuva.",
        "Previsão de chuva em breve. Leve proteção.",
        "Nuvens carregadas se aproximando. Chuva à vista!",
        "Céu nublado indica precipitação em breve.",
        "Melhor levar o guarda-chuva, o tempo está mudando.",
        "Chuva prevista para as próximas horas. Fique atento!",
        "Instabilidade se aproxima. Prepare-se!"
    ],
    calorExtremo: [
        "Calor infernal! Hidrate-se muito.",
        "Sensação de forno ligado.",
        "Onda de calor! {temp}°C de sensação. Beba água!",
        "Temperatura extrema. Evite exposição ao sol.",
        "Dia escaldante! Mantenha-se hidratado.",
        "Calor intenso. Procure ambientes refrigerados.",
        "Temperatura muito elevada. Cuidado com insolação!",
        "Dia de muito calor. Evite atividades ao ar livre.",
        "Sensação térmica elevada. Use protetor solar!",
        "Calor excessivo. Beba líquidos constantemente."
    ],
    frioExtremo: [
        "Frio congelante! Proteja-se.",
        "Hoje é dia de edredom e sopa.",
        "Temperatura muito baixa. Agasalhe-se bem.",
        "Dia gelado! Use camadas de roupa.",
        "Frio intenso. Não esqueça o casaco grosso!",
        "Temperatura baixa. Proteja as extremidades.",
        "Dia de frio cortante. Um chocolate quente cai bem!",
        "Sensação térmica baixa. Cubra-se bem!",
        "Frio significativo. Prefira ambientes fechados.",
        "Dia gelado! Cuidado com resfriados."
    ],
    climaPerfeito: [
        "Clima absolutamente perfeito.",
        "O tempo está uma delícia lá fora.",
        "Condições ideais para aproveitar o dia!",
        "Nem quente nem frio, perfeito!",
        "Dia agradável com temperatura ideal.",
        "Tempo excelente para atividades ao ar livre!",
        "Condições climáticas perfeitas hoje.",
        "Dia lindo para aproveitar a natureza!",
        "Temperatura de cinema. Aproveite!",
        "Clima agradável e convidativo."
    ],
    manha: [
        "Bom dia{nome}! Tempo estável.",
        "Manhã calma lá fora.",
        "Olá{nome}! Ótima manhã para começar.",
        "Dia começando com tempo agradável.",
        "Bom dia{nome}! Ótimo dia para começar bem.",
        "Manhã tranquila com tempo favorável.",
        "Bom dia{nome}! Que seu dia seja ótimo!",
        "Início de dia com tempo agradável."
    ],
    normal: [
        "Tudo normal no clima.",
        "Dia tranquilo por aqui{nome}.",
        "Condições estáveis, aproveite!",
        "Tempo calmo e sem surpresas.",
        "Dia sem grandes variações climáticas.",
        "Condições normais de temperatura.",
        "Tempo estável por enquanto.",
        "Dia comum do ponto de vista meteorológico."
    ],
    noite: [
        "Boa noite{nome}! Céu limpo.",
        "Noite tranquila com bom tempo.",
        "Boa noite{nome}! Tempo favorável.",
        "Noite agradável lá fora."
    ],
    recomendacaoChuva: [
        "Dirija com cautela e faróis baixos.",
        "Evite alagamentos e áreas de risco.",
        "Mantenha distância dos veículos à frente.",
        "Reduza a velocidade nas curvas.",
        "Fique atento a possíveis escorregões."
    ],
    recomendacaoCalor: [
        "Beba bastante água.",
        "Evite exposição direta ao sol.",
        "Use roupas leves e claras.",
        "Busque ambientes refrigerados.",
        "Aplique protetor solar regularmente."
    ],
    recomendacaoFrio: [
        "Agasalhe-se bem antes de sair.",
        "Prefira bebidas quentes.",
        "Proteja mãos e pés do frio.",
        "Evite mudanças bruscas de temperatura.",
        "Mantenha-se em ambientes aquecidos."
    ],
    recomendacaoNormal: [
        "Aproveite o dia!",
        "Ótimo dia para atividades ao ar livre!",
        "Aproveite para fazer exercícios.",
        "Dia perfeito para um passeio.",
        "Aproveite as condições favoráveis!"
    ],
    recomendacaoNoite: [
        "Bom descanso!",
        "Durma bem!",
        "Aproveite a noite tranquila.",
        "Boa noite de sono!"
    ],
    qualidadeArBoa: [
        "Qualidade do ar está ótima.",
        "Ar puro e agradável para respirar.",
        "Condições excelentes de qualidade do ar."
    ],
    qualidadeArRuim: [
        "Qualidade do ar prejudicada. Evite exercícios intensos.",
        "Ar poluído. Pessoas sensíveis devem ter cuidado.",
        "Condições ruins de qualidade do ar. Fique atento!"
    ]
};

const getRandomPhrase = (phrases: string[], seed: number): string => {
    // Usa seed + data atual para variabilidade diária
    const dayOfYear = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    const combinedSeed = seed + dayOfYear;
    const index = Math.abs(combinedSeed) % phrases.length;
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
        const isNight = hour >= 22 || hour < 5;
        const seed = Math.floor(current.dt);

        const next3Hours = hourly.slice(0, 3);
        const tempNow = current.temperature;
        const feelsLike = current.feels_like || tempNow;
        const conditionLower = (current.condition || '').toLowerCase();
        
        const isRainingNow = conditionLower.match(/(chuv|rain|drizzle|garoa|aguaceiro)/);
        const isStorming = conditionLower.match(/(tempestade|trovoada|thunder|trovão)/);
        const willRainSoon = next3Hours.some(h => (h.pop || 0) > 0.6);

        // Alertas de tempestade (prioridade máxima)
        if (isStorming) {
            events.push({ 
                priority: 1, 
                category: 'alert', 
                text: getRandomPhrase(FRASES.tempestade, seed)
            });
        } else if (isRainingNow) {
            events.push({ 
                priority: 2, 
                category: 'rain', 
                text: getRandomPhrase(FRASES.chuvaForte, seed)
            });
        } else if (willRainSoon) {
            events.push({ 
                priority: 2, 
                category: 'rain', 
                text: getRandomPhrase(FRASES.vaiChover, seed)
            });
        }

        // Alertas de temperatura
        if (feelsLike >= 35) {
            events.push({ 
                priority: 2, 
                category: 'temp', 
                text: getRandomPhrase(FRASES.calorExtremo, seed).replace('{temp}', Math.round(feelsLike).toString())
            });
        } else if (feelsLike <= 5) {
            events.push({ 
                priority: 2, 
                category: 'temp', 
                text: getRandomPhrase(FRASES.frioExtremo, seed)
            });
        }

        // Alerta de qualidade do ar
        if (airQuality?.aqi && airQuality.aqi >= 4) {
            events.push({
                priority: 3,
                category: 'air',
                text: getRandomPhrase(FRASES.qualidadeArRuim, seed)
            });
        }

        // Mensagens quando não há alertas
        if (events.length === 0) {
            if (feelsLike >= 18 && feelsLike <= 26) {
                events.push({ 
                    priority: 5, 
                    category: 'lifestyle', 
                    text: getRandomPhrase(FRASES.climaPerfeito, seed)
                });
            } else if (isMorning) {
                events.push({ 
                    priority: 5, 
                    category: 'lifestyle', 
                    text: getRandomPhrase(FRASES.manha, seed).replace('{nome}', userName)
                });
            } else if (isNight) {
                events.push({ 
                    priority: 5, 
                    category: 'lifestyle', 
                    text: getRandomPhrase(FRASES.noite, seed).replace('{nome}', userName)
                });
            } else {
                events.push({ 
                    priority: 5, 
                    category: 'lifestyle', 
                    text: getRandomPhrase(FRASES.normal, seed).replace('{nome}', userName)
                });
            }
        }

        // Qualidade do ar boa (informação complementar)
        if (airQuality?.aqi && airQuality.aqi <= 2 && events.length < 2) {
            events.push({
                priority: 6,
                category: 'air',
                text: getRandomPhrase(FRASES.qualidadeArBoa, seed + 100)
            });
        }

        events.sort((a, b) => (a.priority - b.priority));
        const finalHighlight = events[0]?.text || '';

        // Recomendação contextual
        let recPhrase = '';
        if (isRainingNow) {
            recPhrase = getRandomPhrase(FRASES.recomendacaoChuva, seed);
        } else if (feelsLike > 30) {
            recPhrase = getRandomPhrase(FRASES.recomendacaoCalor, seed);
        } else if (feelsLike < 10) {
            recPhrase = getRandomPhrase(FRASES.recomendacaoFrio, seed);
        } else if (isNight) {
            recPhrase = getRandomPhrase(FRASES.recomendacaoNoite, seed);
        } else {
            recPhrase = getRandomPhrase(FRASES.recomendacaoNormal, seed);
        }

        return { highlight: finalHighlight, recommendation: recPhrase };
    }, [current.dt, settings.userName, config.enabled, airQuality?.aqi]);

    if (!config.enabled) return null;

    const isContainerStyle = config.style === 'container';
    const showHighlight = (config.content === 'highlight' || config.content === 'both') && highlight;
    const showRecommendation = (config.content === 'recommendation' || config.content === 'both') && recommendation;

    if (!showHighlight && !showRecommendation) return null;

    const PulseIndicator = () => {
        if (!config.showPulse) return null;
        const isAlert = highlight.includes("Tempestade") || 
                       highlight.includes("Perigo") || 
                       highlight.includes("extrema") ||
                       highlight.includes("extremo") ||
                       highlight.includes("intenso");
        const pulseColor = isAlert ? "bg-red-500" : classes.bg;
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
