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
    // Simple pseudo-random selection based on time to keep it somewhat stable per render cycle but varied over time
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

        // --- HELPER DATA ---
        const nextHour = hourly[0];
        const secondHour = hourly[1];
        const isRainingNow = (current.rain_1h && current.rain_1h > 0) || 
                             (current.condition || '').toLowerCase().match(/(chuv|rain|drizzle|garoa)/);
        
        const currentTemp = current.feels_like || current.temperature;

        // --- 1. RAIN DYNAMICS (Start/Stop Prediction) ---
        if (isRainingNow) {
            // SCENARIO: Raining -> Will it stop?
            if (nextHour && nextHour.pop !== undefined && nextHour.pop < 0.2) {
                events.push({ 
                    priority: 1, 
                    text: getRandomPhrase([
                        "A chuva deve dar uma trégua em breve.",
                        "Parece que a chuva vai parar na próxima hora.",
                        "O tempo vai abrir logo mais, aguente firme."
                    ]), 
                    type: 'rain' 
                });
            } else {
                 events.push({ 
                    priority: 2, 
                    text: getRandomPhrase([
                        "Chuva contínua. Mantenha-se seco.",
                        "A chuva segue firme por enquanto.",
                        "Não esqueça o guarda-chuva se for sair agora."
                    ]), 
                    type: 'rain' 
                });
            }
        } else {
             // SCENARIO: Not Raining -> Will it start?
             if (nextHour && nextHour.pop !== undefined && nextHour.pop > 0.6) {
                 events.push({ 
                     priority: 1, 
                     text: getRandomPhrase([
                         "Atenção: Chuva chegando na próxima hora!",
                         "Feche as janelas, vem chuva por aí.",
                         "O tempo vai virar em instantes. Prepare-se."
                     ]), 
                     type: 'rain' 
                 });
             } else if (secondHour && secondHour.pop !== undefined && secondHour.pop > 0.7) {
                 events.push({ 
                     priority: 2, 
                     text: getRandomPhrase([
                         "Alta chance de chuva nas próximas horas.",
                         "O céu deve fechar logo mais.",
                         "Planeje-se: previsão de chuva para breve."
                     ]), 
                     type: 'rain' 
                 });
             }
        }

        // --- 2. TEMPERATURE SWINGS (Tomorrow vs Today) ---
        const todayMax = daily[0]?.temperature;
        const tomorrowMax = daily[1]?.temperature;
        
        if (todayMax && tomorrowMax) {
            const diff = tomorrowMax - todayMax;
            if (diff >= 5) {
                events.push({ 
                    priority: 2, 
                    text: getRandomPhrase([
                        "Amanhã vai esquentar bastante!",
                        "Prepare-se: Calorão chegando amanhã.",
                        "Amanhã será bem mais quente que hoje, aproveite."
                    ]), 
                    type: 'temp' 
                });
            } else if (diff <= -5) {
                events.push({ 
                    priority: 2, 
                    text: getRandomPhrase([
                        "A temperatura vai despencar amanhã.",
                        "Tire o casaco do armário, amanhã esfria!",
                        "Uma frente fria está chegando para amanhã."
                    ]), 
                    type: 'temp' 
                });
            }
        }

        // --- 3. COMFORT INDEX (Dew Point & Humidity) ---
        // Dew point > 21 is "sticky/muggy". Humidity < 30 is "dry".
        if (current.dew_point && current.dew_point > 21) {
             events.push({ 
                priority: 3, 
                text: getRandomPhrase([
                    "Sensação de abafamento intenso.",
                    "O ar está pesado e úmido hoje.",
                    "Clima tropical e pegajoso."
                ]), 
                type: 'comfort' 
            });
        } else if (current.humidity < 30) {
            events.push({ 
                priority: 2, 
                text: getRandomPhrase([
                    "Ar muito seco. Hidrate-se!",
                    "Umidade baixa: Beba bastante água hoje.",
                    "Cuidado com os olhos e respiração, ar seco."
                ]), 
                type: 'warning' 
            });
        }

        // --- 4. EXTREME CONDITIONS ---
        if (current.uvi && current.uvi >= 8) {
            events.push({ priority: 1, text: "Índice UV Extremo! Proteja-se do sol agora.", type: 'warning' });
        }
        if (current.windSpeed > 40) {
            events.push({ priority: 1, text: "Ventania forte lá fora, cuidado com objetos soltos.", type: 'wind' });
        }

        // --- 5. CASUAL / GENERAL (Fallback) ---
        if (events.length === 0) {
            if (currentTemp > 28) {
                events.push({ priority: 4, text: getRandomPhrase(["Um belo dia de calor.", "O sol brilha forte.", "Dia quente, aproveite."]), type: 'temp' });
            } else if (currentTemp < 15) {
                events.push({ priority: 4, text: getRandomPhrase(["Dia frio e calmo.", "Clima fresco e agradável.", "Temperatura baixa hoje."]), type: 'temp' });
            } else {
                 events.push({ priority: 4, text: getRandomPhrase(["Condições estáveis no momento.", "Tudo tranquilo com o tempo.", "Sem grandes mudanças por agora."]), type: 'general' });
            }
        }

        // Sort by Priority (1 is most urgent)
        events.sort((a, b) => a.priority - b.priority);
        const finalHighlight = events[0].text;

        // --- RECOMMENDATION ENGINE (Dynamic & Varied) ---
        let recPhrase = "";
        
        // Clothing & Activity logic based on "Feels Like"
        if (currentTemp >= 35) {
            recPhrase = getRandomPhrase([
                `Evite exercícios ao ar livre agora${userName}.`,
                "Procure um lugar com ar condicionado.",
                "Roupas leves e muita água são essenciais.",
                "O calor está intenso, cuidado com a desidratação."
            ]);
        } else if (currentTemp >= 28) {
            recPhrase = getRandomPhrase([
                `Ótimo para uma piscina${userName}!`,
                "Camiseta e shorts são a pedida certa.",
                "Não esqueça os óculos de sol.",
                "Ideal para atividades aquáticas."
            ]);
        } else if (currentTemp >= 20) {
            recPhrase = getRandomPhrase([
                `Clima perfeito para caminhar${userName}.`,
                "Uma camiseta basta, temperatura agradável.",
                "Aproveite para abrir as janelas e arejar a casa.",
                "Ótimo momento para atividades leves."
            ]);
        } else if (currentTemp >= 14) {
             recPhrase = getRandomPhrase([
                "Um casaquinho leve cai bem.",
                "Está fresco, leve uma blusa se for sair.",
                "Clima de meia-estação, vista-se em camadas.",
                "Um café quente cairia bem agora."
            ]);
        } else if (currentTemp >= 8) {
            recPhrase = getRandomPhrase([
                "Hora de usar aquele casaco mais quente.",
                `Se agasalhe bem${userName}.`,
                "Luvas podem ser úteis se tiver vento.",
                "Mantenha-se aquecido."
            ]);
        } else {
            recPhrase = getRandomPhrase([
                "Congelante! Proteja-se do frio extremo.",
                "Várias camadas de roupa são necessárias.",
                "Bebidas quentes vão ajudar a aquecer.",
                "Evite exposição prolongada ao frio."
            ]);
        }

        // Combine logic: If the Highlight is about Rain, add umbrella advice if not present
        if (finalHighlight.toLowerCase().includes('chuva') && !recPhrase.toLowerCase().includes('guarda-chuva')) {
             recPhrase += " " + getRandomPhrase(["Leve o guarda-chuva.", "Cuidado nas pistas molhadas.", "Calçado impermeável ajuda."]);
        }

        // If the Highlight is about Dry Air, override rec to hydration
        if (finalHighlight.toLowerCase().includes('seco') || finalHighlight.toLowerCase().includes('água')) {
            recPhrase = "Mantenha uma garrafa de água por perto o dia todo.";
        }

        return {
            highlight: finalHighlight,
            recommendation: recPhrase
        };
    }, [current, hourly, daily, settings.userName]);

    // --- RENDER ---
    const isContainerStyle = config.style === 'container';
    const showHighlight = (config.content === 'highlight' || config.content === 'both') && highlight;
    const showRecommendation = (config.content === 'recommendation' || config.content === 'both') && recommendation;

    if (!showHighlight && !showRecommendation) return null;

    if (isContainerStyle) {
        return (
            <div className={`rounded-3xl ${density.padding} ${cardClass} animate-enter`}>
                <div className="flex flex-col gap-2">
                    {showHighlight && (
                        <div>
                            <h3 className={`${density.sectionTitle} font-bold text-white mb-1 flex items-center gap-2`}>
                                <span className="relative flex h-3 w-3">
                                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${classes.bg} opacity-75`}></span>
                                  <span className={`relative inline-flex rounded-full h-3 w-3 ${classes.bg}`}></span>
                                </span>
                                {highlight}
                            </h3>
                        </div>
                    )}
                    {showHighlight && showRecommendation && <div className="h-[1px] bg-white/10 w-full my-1" />}
                    {showRecommendation && (
                         <p className={`${density.text} text-gray-300 leading-relaxed`}>
                            {recommendation}
                        </p>
                    )}
                </div>
            </div>
        );
    } else {
        // CLEAN STYLE (Text Only)
        return (
            <div className={`px-2 py-4 animate-enter flex flex-col gap-2`}>
                 {showHighlight && (
                    <h3 className={`text-xl md:text-2xl font-bold text-white tracking-tight drop-shadow-md flex items-start gap-3`}>
                         <span className="relative flex h-3 w-3 mt-1.5 flex-shrink-0">
                                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${classes.bg} opacity-75`}></span>
                                  <span className={`relative inline-flex rounded-full h-3 w-3 ${classes.bg}`}></span>
                        </span>
                         {highlight}
                    </h3>
                )}
                {showRecommendation && (
                     <p className={`text-base font-medium text-gray-200 drop-shadow-sm opacity-90 pl-6 leading-relaxed`}>
                        {recommendation}
                    </p>
                )}
            </div>
        );
    }
};

export default WeatherInsights;