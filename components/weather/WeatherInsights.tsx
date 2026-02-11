

import React, { useMemo } from 'react';
import type { WeatherData, HourlyForecast, DailyForecast, AirQualityData } from '../../types';
import { useTheme } from '../context/ThemeContext';
import { getSettings } from '../../services/settingsService';
import { 
    SunIcon, 
    CloudRainIcon, 
    WindIcon, 
    ThermometerIcon, 
    AlertTriangleIcon,
    EyeIcon,
    HeartIcon,
    CloudIcon,
    CloudSnowIcon
} from '../icons';

interface WeatherInsightsProps {
    current: WeatherData;
    hourly: HourlyForecast[];
    daily: DailyForecast[];
    airQuality?: AirQualityData | null;
}

interface InsightItem {
    priority: number;
    icon: React.ReactNode;
    title: string;
    message: string;
    category: 'critical' | 'warning' | 'caution' | 'info' | 'positive';
    color: string;
}

// Calcula índice de conforto térmico (simplificado)
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

// Análise de UV
const getUVInsight = (uvi: number | undefined): InsightItem | null => {
    if (uvi === undefined) return null;
    
    if (uvi >= 11) {
        return {
            priority: 1,
            icon: <SunIcon className="w-5 h-5 text-purple-400" />,
            title: 'UV Extremo',
            message: 'Risco extremo! Evite sol das 10h às 16h. Use protetor FPS 50+, óculos e chapéu.',
            category: 'critical',
            color: 'text-purple-400'
        };
    }
    if (uvi >= 8) {
        return {
            priority: 2,
            icon: <SunIcon className="w-5 h-5 text-red-400" />,
            title: 'UV Muito Alto',
            message: 'Proteção solar essencial. Limite exposição ao sol principalmente ao meio-dia.',
            category: 'warning',
            color: 'text-red-400'
        };
    }
    if (uvi >= 6) {
        return {
            priority: 3,
            icon: <SunIcon className="w-5 h-5 text-orange-400" />,
            title: 'UV Alto',
            message: 'Use protetor solar e busque sombra durante o pico solar.',
            category: 'caution',
            color: 'text-orange-400'
        };
    }
    if (uvi >= 3) {
        return {
            priority: 5,
            icon: <SunIcon className="w-5 h-5 text-yellow-400" />,
            title: 'UV Moderado',
            message: 'Protetor solar recomendado para exposição prolongada.',
            category: 'info',
            color: 'text-yellow-400'
        };
    }
    return null;
};

// Análise de Qualidade do Ar
const getAirQualityInsight = (aqi: number | undefined): InsightItem | null => {
    if (aqi === undefined) return null;
    
    const aqiText: Record<number, { title: string; msg: string; color: string; priority: number; category: any }> = {
        1: { title: 'Ar Excelente', msg: 'Qualidade do ar ótima. Aproveite atividades ao ar livre!', color: 'text-emerald-400', priority: 10, category: 'positive' },
        2: { title: 'Ar Bom', msg: 'Qualidade aceitável. Ideal para a maioria das pessoas.', color: 'text-green-400', priority: 10, category: 'positive' },
        3: { title: 'Ar Moderado', msg: 'Sensíveis devem evitar exercícios intensos ao ar livre.', color: 'text-yellow-400', priority: 4, category: 'caution' },
        4: { title: 'Ar Insalubre', msg: 'Todos podem sentir efeitos. Evite atividades ao ar livre.', color: 'text-orange-400', priority: 2, category: 'warning' },
        5: { title: 'Ar Perigoso', msg: 'Emergência! Evite sair. Use máscara se necessário.', color: 'text-red-400', priority: 1, category: 'critical' },
    };
    
    const info = aqiText[aqi] || aqiText[2];
    
    return {
        priority: info.priority,
        icon: <WindIcon className={`w-5 h-5 ${info.color}`} />,
        title: info.title,
        message: info.msg,
        category: info.category,
        color: info.color
    };
};

const WeatherInsights: React.FC<WeatherInsightsProps> = ({ current, hourly, daily, airQuality }) => {
    const { classes, cardClass, glassClass, density, isPerformanceMode } = useTheme();
    const settings = getSettings();
    const config = settings.weatherInsights;

    const insights = useMemo(() => {
        if (!config.enabled) return [];

        const items: InsightItem[] = [];
        const userName = settings.userName ? ` ${settings.userName}` : '';
        const now = new Date();
        const hour = now.getHours();
        const isMorning = hour >= 5 && hour < 12;
        const isAfternoon = hour >= 12 && hour < 18;
        const isEvening = hour >= 18 && hour < 22;
        const isNight = hour >= 22 || hour < 5;

        const next6Hours = hourly.slice(0, 6);
        const tempNow = current.temperature;
        const feelsLike = current.feels_like ?? tempNow;
        const windSpeed = current.windSpeed;
        const humidity = current.humidity;
        const uvi = current.uvi;
        const conditionLower = (current.condition || '').toLowerCase();
        const aqi = airQuality?.aqi;

        // Detectar condições
        const isRaining = /(chuv|rain|drizzle|garoa|aguaceiro)/.test(conditionLower);
        const isStorming = /(tempestade|trovoada|thunder|trovão)/.test(conditionLower);
        const isSnowing = /(neve|snow)/.test(conditionLower);
        const willRain = next6Hours.some(h => (h.pop || 0) > 0.5);
        const rainIntensity = next6Hours.reduce((acc, h) => Math.max(acc, h.pop || 0), 0);
        
        // 1. ALERTAS CRÍTICOS (Tempestade)
        if (isStorming) {
            items.push({
                priority: 1,
                icon: <AlertTriangleIcon className="w-5 h-5 text-red-500" />,
                title: '⚡ Tempestade Ativa',
                message: 'Raios e trovões detectados. Fique em local fechado, evite árvores e fios. Tire aparelhos da tomada.',
                category: 'critical',
                color: 'text-red-500'
            });
        }

        // 2. CHUVA (Atual ou iminente)
        if (isRaining && !isStorming) {
            const msg = rainIntensity > 0.7 
                ? 'Chuva forte no momento. Reduza a velocidade se estiver dirigindo.'
                : 'Chuva moderada. Leve guarda-chuva e calçado adequado.';
            items.push({
                priority: 2,
                icon: <CloudRainIcon className="w-5 h-5 text-blue-400" />,
                title: '🌧️ Chuva em Andamento',
                message: msg,
                category: 'warning',
                color: 'text-blue-400'
            });
        } else if (willRain && !isRaining) {
            const hoursUntilRain = next6Hours.findIndex(h => (h.pop || 0) > 0.5) + 1;
            const timeMsg = hoursUntilRain === 1 ? 'na próxima hora' : `em ${hoursUntilRain} horas`;
            items.push({
                priority: 3,
                icon: <CloudRainIcon className="w-5 h-5 text-cyan-400" />,
                title: '☔ Chuva à Vista',
                message: `Previsão de chuva ${timeMsg}. Leve guarda-chuva se for sair.`,
                category: 'caution',
                color: 'text-cyan-400'
            });
        }

        // 3. NEVASCA
        if (isSnowing) {
            items.push({
                priority: 1,
                icon: <CloudSnowIcon className="w-5 h-5 text-blue-200" />,
                title: '❄️ Neve em Andamento',
                message: 'Pavimento pode estar escorregadio. Use calçado adequado e dirija com extrema cautela.',
                category: 'warning',
                color: 'text-blue-200'
            });
        }

        // 4. UV (só durante o dia)
        if (!isNight && uvi !== undefined) {
            const uvInsight = getUVInsight(uvi);
            if (uvInsight) items.push(uvInsight);
        }

        // 5. QUALIDADE DO AR
        const aqInsight = getAirQualityInsight(aqi);
        if (aqInsight) items.push(aqInsight);

        // 6. TEMPERATURA EXTREMA
        if (feelsLike >= 35) {
            items.push({
                priority: 2,
                icon: <ThermometerIcon className="w-5 h-5 text-red-500" />,
                title: '🌡️ Calor Extremo',
                message: `Sensação de ${Math.round(feelsLike)}°C! Hidrate-se constantemente, evite sol direto e procure ambientes refrigerados.`,
                category: 'critical',
                color: 'text-red-500'
            });
        } else if (feelsLike >= 30) {
            items.push({
                priority: 3,
                icon: <ThermometerIcon className="w-5 h-5 text-orange-400" />,
                title: '🌡️ Dia Quente',
                message: 'Beba bastante água. Use roupas leves e claras. Evite exercícios ao meio-dia.',
                category: 'warning',
                color: 'text-orange-400'
            });
        } else if (feelsLike <= 5) {
            items.push({
                priority: 2,
                icon: <ThermometerIcon className="w-5 h-5 text-cyan-400" />,
                title: '❄️ Frio Intenso',
                message: 'Proteja-se bem. Use camadas de roupa. Cuidado com hipotermia em exposição prolongada.',
                category: 'warning',
                color: 'text-cyan-400'
            });
        } else if (feelsLike <= 10) {
            items.push({
                priority: 4,
                icon: <ThermometerIcon className="w-5 h-5 text-blue-400" />,
                title: '🧥 Dia Friozinho',
                message: 'Leve um casaco. Ótimo para aquele chocolate quente!',
                category: 'caution',
                color: 'text-blue-400'
            });
        }

        // 7. VENTO FORTE
        if (windSpeed >= 50) {
            items.push({
                priority: 2,
                icon: <WindIcon className="w-5 h-5 text-yellow-400" />,
                title: '💨 Ventania',
                message: 'Ventos muito fortes! Cuidado com objetos soltos. Evite ficar perto de árvores.',
                category: 'warning',
                color: 'text-yellow-400'
            });
        } else if (windSpeed >= 30) {
            items.push({
                priority: 5,
                icon: <WindIcon className="w-5 h-5 text-gray-400" />,
                title: '💨 Vento Forte',
                message: 'Vento moderado a forte. Proteja objetos leves ao ar livre.',
                category: 'info',
                color: 'text-gray-400'
            });
        }

        // 8. UMIDADE EXTREMA
        if (humidity >= 85 && tempNow > 20) {
            items.push({
                priority: 4,
                icon: <CloudIcon className="w-5 h-5 text-blue-300" />,
                title: '💧 Ar Úmido',
                message: 'Umidade alta pode causar desconforto. Use ventiladores ou ar condicionado.',
                category: 'caution',
                color: 'text-blue-300'
            });
        } else if (humidity <= 25) {
            items.push({
                priority: 5,
                icon: <EyeIcon className="w-5 h-5 text-yellow-400" />,
                title: '🏜️ Ar Muito Seco',
                message: 'Umidade baixa. Hidrate a pele, use protetor labial e beba água.',
                category: 'caution',
                color: 'text-yellow-400'
            });
        }

        // 9. CLIMA PERFEITO (só se não houver alertas)
        if (items.length === 0) {
            const comfort = calculateComfortIndex(tempNow, humidity);
            if (comfort.level === 'perfect') {
                let timeBasedMsg = '';
                if (isMorning) timeBasedMsg = 'Ótima manhã para uma caminhada! ☕';
                else if (isAfternoon) timeBasedMsg = 'Tarde perfeita para atividades ao ar livre! 🌳';
                else if (isEvening) timeBasedMsg = 'Noite agradável para relaxar! 🌅';
                else timeBasedMsg = 'Aproveite esse clima maravilhoso! ✨';

                items.push({
                    priority: 10,
                    icon: <HeartIcon className="w-5 h-5 text-rose-400" />,
                    title: `${comfort.emoji} Clima Perfeito`,
                    message: timeBasedMsg,
                    category: 'positive',
                    color: 'text-rose-400'
                });
            } else {
                // Mensagem genérica positiva baseada no horário
                let greeting = '';
                if (isMorning) greeting = `Bom dia${userName}! ☕`;
                else if (isAfternoon) greeting = `Boa tarde${userName}! 🌤️`;
                else if (isEvening) greeting = `Boa noite${userName}! 🌙`;
                else greeting = `Olá${userName}! 🌟`;

                items.push({
                    priority: 10,
                    icon: <CloudIcon className="w-5 h-5 text-gray-400" />,
                    title: greeting,
                    message: 'Condições climáticas estáveis. Tenha um ótimo dia!',
                    category: 'info',
                    color: 'text-gray-400'
                });
            }
        }

        // Ordenar por prioridade (menor número = mais importante)
        items.sort((a, b) => a.priority - b.priority);
        
        return items;
    }, [current, hourly, airQuality, settings.userName, config.enabled]);

    if (!config.enabled || insights.length === 0) return null;

    // Pegar os 2 insights mais importantes
    const displayInsights = insights.slice(0, 2);
    const mainInsight = displayInsights[0];
    const secondaryInsight = displayInsights[1];

    const PulseIndicator = ({ color }: { color: string }) => {
        if (!config.showPulse) return null;
        const isCritical = mainInsight.category === 'critical';
        return (
            <span className="relative flex h-2.5 w-2.5 mr-2 self-center flex-shrink-0">
                {!settings.reducedMotion && !isPerformanceMode && (
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isCritical ? 'bg-red-500' : color.replace('text-', 'bg-')} opacity-75`}></span>
                )}
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isCritical ? 'bg-red-500' : color.replace('text-', 'bg-')}`}></span>
            </span>
        );
    };

    // Estilo Container
    if (config.style === 'container') {
        return (
            <div className={`rounded-3xl ${density.padding} ${cardClass} animate-enter`}>
                <div className="space-y-4">
                    {/* Insight Principal */}
                    <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-xl bg-white/5 ${mainInsight.color}`}>
                            {mainInsight.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <PulseIndicator color={mainInsight.color} />
                                <h3 className={`font-bold text-white ${density.text} leading-tight`}>
                                    {mainInsight.title}
                                </h3>
                            </div>
                            <p className={`${density.subtext} text-gray-300 leading-relaxed`}>
                                {mainInsight.message}
                            </p>
                        </div>
                    </div>

                    {/* Insight Secundário (se existir) */}
                    {secondaryInsight && config.content === 'both' && (
                        <>
                            <div className="h-px bg-white/10" />
                            <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-xl bg-white/5 ${secondaryInsight.color}`}>
                                    {secondaryInsight.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className={`font-semibold text-gray-200 ${density.subtext} mb-1`}>
                                        {secondaryInsight.title}
                                    </h4>
                                    <p className={`text-sm text-gray-400 leading-relaxed`}>
                                        {secondaryInsight.message}
                                    </p>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    }

    // Estilo Clean (padrão)
    return (
        <div className={`px-2 py-4 animate-enter`}>
            <div className="flex items-start gap-3">
                <div className={`p-2 rounded-xl bg-white/5 ${mainInsight.color} flex-shrink-0`}>
                    {mainInsight.icon}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <PulseIndicator color={mainInsight.color} />
                        <h3 className={`font-bold text-white ${density.titleText} leading-tight`}>
                            {mainInsight.title}
                        </h3>
                    </div>
                    <p className={`${density.text} text-gray-300 leading-relaxed`}>
                        {mainInsight.message}
                    </p>
                    
                    {secondaryInsight && config.content === 'both' && (
                        <p className={`mt-2 text-sm text-gray-400 border-l-2 border-white/10 pl-3`}>
                            <span className={secondaryInsight.color}>{secondaryInsight.title}:</span>{' '}
                            {secondaryInsight.message}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WeatherInsights;
