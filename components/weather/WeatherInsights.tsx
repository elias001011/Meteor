
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
    priority: number; // 1 (Crítico) a 10 (Irrelevante)
    text: string;
    category: 'alert' | 'rain' | 'temp' | 'wind' | 'sun' | 'comfort' | 'lifestyle' | 'warning';
}

const getRandomPhrase = (phrases: string[], seed: number) => {
    // Deterministic random based on the seed (dt) so it stays the same for the same data
    const index = (seed + phrases.length) % phrases.length; 
    // Add a bit of Math.random only if we really wanted variation, but user asked for CACHE STABILITY.
    // So we use strict modulo to ensure same data = same phrase.
    return phrases[index];
};

const WeatherInsights: React.FC<WeatherInsightsProps> = ({ current, hourly, daily }) => {
    const { classes, cardClass, density, isPerformanceMode } = useTheme();
    const settings = getSettings();
    const config = settings.weatherInsights;

    // We depend ONLY on current.dt (timestamp) for the logic regeneration.
    // This prevents the text from changing when switching tabs or interacting with other UI elements.
    const { highlight, recommendation } = useMemo(() => {
        if (!config.enabled) return { highlight: '', recommendation: '' };

        const events: AnalysisEvent[] = [];
        const userName = settings.userName ? ` ${settings.userName}` : '';
        const now = new Date();
        const hour = now.getHours();
        const isMorning = hour >= 5 && hour < 12;
        // const isAfternoon = hour >= 12 && hour < 18; // Unused
        // const isEvening = hour >= 18 && hour < 22; // Unused
        const isNight = hour >= 22 || hour < 5;
        
        // Seed for randomness stability
        const seed = Math.floor(current.dt);

        // Dados Meteorológicos
        const nextHour = hourly[0];
        const next3Hours = hourly.slice(0, 3);
        const tempNow = current.temperature;
        const feelsLike = current.feels_like || tempNow;
        const windSpeed = current.windSpeed;
        const humidity = current.humidity;
        const conditionLower = (current.condition || '').toLowerCase();
        
        // --- 1. CHUVA E TEMPESTADE (Prioridade 1) ---
        const isRainingNow = conditionLower.match(/(chuv|rain|drizzle|garoa|aguaceiro)/);
        const isStorming = conditionLower.match(/(tempestade|trovoada|thunder|trovão)/);
        const willRainSoon = next3Hours.some(h => (h.pop || 0) > 0.6);
        const willStopRaining = isRainingNow && nextHour && (nextHour.pop || 0) < 0.2;

        if (isStorming) {
            events.push({ priority: 1, category: 'alert', text: getRandomPhrase([
                "Tempestade em andamento. Fique em local seguro.",
                "O céu está bravo lá fora. Evite sair.",
                "Raios e trovões detectados. Tire eletrônicos da tomada.",
                "Condições severas. Atenção redobrada.",
                "Melhor cancelar planos externos agora."
            ], seed)});
        } else if (isRainingNow) {
            if (willStopRaining) {
                events.push({ priority: 2, category: 'rain', text: getRandomPhrase([
                    "A chuva está perdendo força.",
                    "Aguente firme, o céu deve limpar em breve.",
                    "É só uma chuva passageira, logo acaba.",
                    "O pior da chuva já passou."
                ], seed)});
            } else {
                if (current.rain_1h && current.rain_1h > 5) {
                    events.push({ priority: 2, category: 'rain', text: getRandomPhrase([
                        "Está caindo o mundo lá fora!",
                        "Chuva torrencial. Visibilidade baixa.",
                        "Não saia sem guarda-chuva reforçado.",
                        "Ruas podem estar alagadas. Cuidado.",
                        "Barulhinho de chuva forte no telhado."
                    ], seed)});
                } else {
                    events.push({ priority: 2, category: 'rain', text: getRandomPhrase([
                        "Dia cinza e chuvoso.",
                        "Aquela garoa chata que não para.",
                        "Pistas molhadas e escorregadias.",
                        "Clima perfeito para ficar na cama.",
                        "Um café cai bem com essa chuva.",
                        "Guarda-chuva é item obrigatório hoje."
                    ], seed)});
                }
            }
        } else if (willRainSoon) {
            events.push({ priority: 2, category: 'rain', text: getRandomPhrase([
                "O cheiro de chuva está no ar.",
                "Feche as janelas, vem água por aí.",
                "Nuvens carregadas se aproximando.",
                "O tempo vai virar nas próximas horas.",
                "A previsão indica chuva em breve."
            ], seed)});
        }

        // --- 2. EXTREMOS TÉRMICOS (Prioridade 2-3) ---
        const diffTemp = tempNow - feelsLike; 

        // CALOR
        if (feelsLike >= 35) {
            events.push({ priority: 2, category: 'temp', text: getRandomPhrase([
                "Calor infernal! Hidrate-se muito.",
                "Sol escaldante. Evite exposição direta.",
                "Sensação de forno ligado.",
                "O asfalto está derretendo lá fora.",
                "Ar condicionado não é luxo, é sobrevivência hoje."
            ], seed)});
        } else if (feelsLike >= 30) {
            if (humidity > 70) {
                events.push({ priority: 3, category: 'comfort', text: getRandomPhrase([
                    "Calor úmido e pegajoso.",
                    "Está abafado, parece uma sauna.",
                    "O ar está pesado hoje.",
                    "Sensação térmica sufocante."
                ], seed)});
            } else {
                events.push({ priority: 3, category: 'temp', text: getRandomPhrase([
                    "Dia quente e seco.",
                    "Sol forte, aproveite com moderação.",
                    "Belo dia para uma piscina.",
                    "O verão está mostrando sua força."
                ], seed)});
            }
        }

        // FRIO
        else if (feelsLike <= 5) {
            events.push({ priority: 2, category: 'temp', text: getRandomPhrase([
                "Frio congelante! Proteja-se.",
                "Está glacial lá fora.",
                "Risco de geada ou hipotermia se desprotegido.",
                "Hoje é dia de edredom e sopa.",
                "Não saia sem luvas e gorro."
            ], seed)});
        } else if (feelsLike <= 13) {
            if (diffTemp > 3) {
                events.push({ priority: 3, category: 'wind', text: getRandomPhrase([
                    `O vento faz parecer ${Math.round(feelsLike)}°C. Cortante!`,
                    "Vento gelado castigando o rosto.",
                    "A sensação térmica está muito abaixo do termômetro.",
                    "Frio penetrante por causa do vento."
                ], seed)});
            } else {
                events.push({ priority: 3, category: 'temp', text: getRandomPhrase([
                    "Friozinho bom para um filme.",
                    "Casaco pesado é recomendado.",
                    "Ar gelado, respire devagar.",
                    "Mãos geladas, coração quente?",
                    "Aquele frio que pede um café quentinho."
                ], seed)});
            }
        }

        // --- 3. VENTO E ALERTA (Prioridade 3) ---
        if (windSpeed > 50) {
            events.push({ priority: 1, category: 'wind', text: getRandomPhrase([
                "Vendaval perigoso! Cuidado com árvores.",
                "Ventos com força de tempestade.",
                "Objetos podem voar com esse vento.",
                "Segure o volante com firmeza se dirigir."
            ], seed)});
        } else if (windSpeed > 30) {
            events.push({ priority: 3, category: 'wind', text: getRandomPhrase([
                "Venta bastante lá fora.",
                "Dia muito ventilado.",
                "Cuidado com janelas batendo.",
                "Não é um bom dia para o penteado."
            ], seed)});
        }

        // --- 4. CONDIÇÕES ESPECÍFICAS (UV, Neblina, Ar Seco) ---
        if (current.uvi && current.uvi >= 8 && !isNight) {
            events.push({ priority: 2, category: 'sun', text: getRandomPhrase([
                "Índice UV Extremo. O sol está perigoso.",
                "Risco de queimadura em menos de 15 min.",
                "Use filtro solar fator alto agora.",
                "Procure sombra imediatamente."
            ], seed)});
        }

        if (current.visibility && current.visibility < 1000) {
            events.push({ priority: 2, category: 'warning', text: getRandomPhrase([
                "Neblina densa, parece Silent Hill.",
                "Visibilidade quase zero. Dirija devagar.",
                "O mundo sumiu na neblina.",
                "Cuidado redobrado no trânsito."
            ], seed)});
        }

        if (humidity < 20) {
            events.push({ priority: 3, category: 'warning', text: getRandomPhrase([
                "Ar extremamente seco. Beba muita água.",
                "Umidade de deserto. Hidrate os olhos.",
                "Risco de incêndios elevado.",
                "Sua pele precisa de hidratação hoje."
            ], seed)});
        }

        // --- 5. LIFESTYLE / GENÉRICO (Fallback) ---
        if (events.length === 0) {
            if (feelsLike >= 18 && feelsLike <= 26 && humidity > 30 && humidity < 80) {
                events.push({ priority: 5, category: 'lifestyle', text: getRandomPhrase([
                    "Clima absolutamente perfeito.",
                    "O tempo está uma delícia lá fora.",
                    "Nem quente, nem frio. O ponto ideal.",
                    "Abra as janelas e deixe o ar entrar.",
                    "Aproveite, dias assim são raros.",
                    "Condições ideais para qualquer coisa."
                ], seed)});
            } else if (isMorning) {
                events.push({ priority: 5, category: 'lifestyle', text: getRandomPhrase([
                    `Bom dia${userName}! O tempo está estável.`,
                    "Começando o dia com clima tranquilo.",
                    "Nada de surpresas no clima por enquanto.",
                    "Manhã calma lá fora.",
                    "Ótimo momento para uma caminhada matinal."
                ], seed)});
            } else if (isNight) {
                events.push({ priority: 5, category: 'lifestyle', text: getRandomPhrase([
                    "Uma noite tranquila para descansar.",
                    "Céu noturno estável.",
                    "Hora de desacelerar, o tempo ajuda.",
                    "Boa noite. O clima está calmo.",
                    "Silêncio e clima ameno lá fora."
                ], seed)});
            } else {
                events.push({ priority: 5, category: 'lifestyle', text: getRandomPhrase([
                    "Tudo normal no front meteorológico.",
                    "O tempo segue sua rotina.",
                    "Condições estáveis no momento.",
                    "Nada drástico acontecendo agora.",
                    `Dia tranquilo por aqui${userName}.`
                ], seed)});
            }
        }

        events.sort((a, b) => (a.priority - b.priority));
        const finalHighlight = events[0].text;

        // --- RECOMENDAÇÃO ---
        let recPhrase = "";
        
        // Random getter for recommendation (using modified seed to not match highlight pattern exactly)
        const getRec = (list: string[]) => getRandomPhrase(list, seed + 1);

        if (isStorming || isRainingNow) {
            recPhrase = getRec([
                "Dirija com cautela e faróis baixos.",
                "Ótimo momento para maratonar uma série.",
                "Verifique se as janelas estão fechadas.",
                "O trânsito pode estar complicado.",
                "Cuidado com poças d'água."
            ]);
        } else if (current.uvi && current.uvi >= 7) {
            recPhrase = getRec([
                "Óculos escuros e chapéu são bem-vindos.",
                "Procure sombra se estiver na rua.",
                "Reaplique o protetor solar.",
                "Proteja as crianças do sol."
            ]);
        } else if (feelsLike > 30) {
            recPhrase = getRec([
                `Beba bastante água${userName}, sério.`,
                "Use roupas leves e de cores claras.",
                "Evite exercícios intensos agora.",
                "Coma frutas e alimentos leves.",
                "Mantenha o ambiente ventilado."
            ]);
        } else if (feelsLike < 12) {
            recPhrase = getRec([
                `Se agasalhe bem${userName}.`,
                "Evite mudanças bruscas de temperatura.",
                "Um chá ou café quente cairia bem.",
                "Proteja o pescoço do vento.",
                "Camadas de roupa funcionam melhor."
            ]);
        } else if (humidity < 25) {
             recPhrase = getRec([
                "Use soro fisiológico no nariz.",
                "Um umidificador ajudaria muito.",
                "Evite exercícios ao ar livre.",
                "Beba água mesmo sem sede."
            ]);
        } else {
            if (isMorning) {
                recPhrase = getRec([
                    "Que você tenha um dia produtivo!",
                    "Ótimo para exercícios ao ar livre.",
                    "Tome um bom café da manhã.",
                    "Energia lá em cima hoje!"
                ]);
            } else if (isNight) {
                recPhrase = getRec([
                    "Bom descanso!",
                    "Desconecte-se um pouco.",
                    "Prepare-se para uma boa noite de sono.",
                    "Amanhã é um novo dia."
                ]);
            } else {
                recPhrase = getRec([
                    "Aproveite o dia!",
                    `Tenha uma excelente tarde${userName}.`,
                    "Faça uma pausa e respire fundo.",
                    "Se puder, dê uma caminhada."
                ]);
            }
        }

        return { highlight: finalHighlight, recommendation: recPhrase };
    }, [current.dt, settings.userName, config.enabled]); // Depend ONLY on timestamp and username

    if (!config.enabled) return null;

    const isContainerStyle = config.style === 'container';
    const showHighlight = (config.content === 'highlight' || config.content === 'both') && highlight;
    const showRecommendation = (config.content === 'recommendation' || config.content === 'both') && recommendation;

    if (!showHighlight && !showRecommendation) return null;

    const PulseIndicator = () => {
        if (!config.showPulse) return null;
        
        let pulseColor = classes.bg;
        if (highlight.includes("Tempestade") || highlight.includes("Perigo") || highlight.includes("Extremo")) {
            pulseColor = "bg-red-500";
        } else if (highlight.includes("Chuva") || highlight.includes("Vento")) {
            pulseColor = "bg-blue-400";
        }

        const shouldAnimate = !settings.reducedMotion && !isPerformanceMode;

        return (
            <span className="relative flex h-3 w-3 mr-2 self-center flex-shrink-0">
                {shouldAnimate && (
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${pulseColor} opacity-75`}></span>
                )}
                <span className={`relative inline-flex rounded-full h-3 w-3 ${pulseColor}`}></span>
            </span>
        );
    };

    if (isContainerStyle) {
        return (
            <div className={`rounded-3xl ${density.padding} ${cardClass} animate-enter`}>
                <div className="flex flex-col gap-2">
                    {showHighlight && (
                        <div>
                            <h3 className={`${density.sectionTitle} font-bold text-white mb-1 flex items-baseline leading-snug`}>
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
        return (
            <div className={`px-2 py-4 animate-enter flex flex-col gap-2`}>
                 {showHighlight && (
                    <h3 className={`text-xl md:text-2xl font-bold text-white tracking-tight drop-shadow-md flex items-baseline leading-snug`}>
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
