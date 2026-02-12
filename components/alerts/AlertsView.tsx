import React, { useState, useEffect, useMemo } from 'react';
import type { WeatherData, WeatherAlert } from '../../types';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { AlertTriangleIcon, BellIcon, InfoIcon, SmartphoneIcon, MapPinIcon } from '../icons';
import { 
    isPushSupported, 
    subscribeToPush, 
    unsubscribeFromPush, 
    getPushSubscriptionStatus,
    sendTestNotification,
    isIOSSafari,
    isPWAInstalled
} from '../../services/pushNotificationService';

interface AlertsViewProps {
    currentWeather?: WeatherData | null;
    dailyForecast?: any[];
    apiAlerts?: WeatherAlert[];
}

interface LocalAlert {
    id: string;
    type: 'storm' | 'rain' | 'heat' | 'cold' | 'wind' | 'uv' | 'frost';
    level: 'critical' | 'warning' | 'caution';
    title: string;
    message: string;
    timestamp: number;
    expiresAt: number;
}

const generateLocalAlerts = (weather: WeatherData | null | undefined, dailyForecast?: any[]): LocalAlert[] => {
    if (!weather) return [];
    
    const alerts: LocalAlert[] = [];
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    
    const condition = weather.condition?.toLowerCase() || '';
    const temp = weather.temperature;
    const feelsLike = weather.feels_like ?? temp;
    const windSpeed = weather.windSpeed;
    
    let uvi = weather.uvi;
    if ((uvi === undefined || uvi === null) && dailyForecast && dailyForecast.length > 0) {
        uvi = dailyForecast[0].uvi;
    }
    
    // Tempestade
    if (condition.includes('tempestade') || condition.includes('trovoada') || condition.includes('thunderstorm')) {
        alerts.push({
            id: 'storm-current',
            type: 'storm',
            level: 'critical',
            title: 'Tempestade em Andamento',
            message: 'Raios e trovões detectados na sua região. Fique em local fechado e evite áreas abertas.',
            timestamp: now,
            expiresAt: now + oneHour
        });
    }
    else if (condition.includes('chuva forte') || condition.includes('heavy rain') || condition.includes('chuva intensa')) {
        alerts.push({
            id: 'rain-heavy',
            type: 'rain',
            level: 'warning',
            title: 'Chuva Intensa',
            message: 'Precipitação intensa pode causar alagamentos. Evite sair e não estacione em áreas baixas.',
            timestamp: now,
            expiresAt: now + oneHour
        });
    }
    
    // Calor extremo
    if (feelsLike >= 38) {
        alerts.push({
            id: 'heat-extreme',
            type: 'heat',
            level: 'critical',
            title: 'Onda de Calor',
            message: `Sensação térmica de ${Math.round(feelsLike)}°C. Risco de insolação. Evite sol das 10h às 16h, beba muita água.`,
            timestamp: now,
            expiresAt: now + oneHour * 6
        });
    } else if (feelsLike >= 35) {
        alerts.push({
            id: 'heat-high',
            type: 'heat',
            level: 'warning',
            title: 'Calor Intenso',
            message: `Sensação de ${Math.round(feelsLike)}°C. Hidrate-se constantemente e busque ambientes refrigerados.`,
            timestamp: now,
            expiresAt: now + oneHour * 4
        });
    }
    
    // Frio extremo
    if (feelsLike <= 3) {
        alerts.push({
            id: 'cold-extreme',
            type: 'cold',
            level: 'critical',
            title: 'Frio Intenso',
            message: `Sensação de ${Math.round(feelsLike)}°C. Risco de hipotermia. Agasalhe-se bem e evite exposição prolongada.`,
            timestamp: now,
            expiresAt: now + oneHour * 6
        });
    } else if (feelsLike <= 8) {
        alerts.push({
            id: 'cold-high',
            type: 'cold',
            level: 'caution',
            title: 'Temperatura Baixa',
            message: 'Frio significativo. Use várias camadas de roupa ao sair.',
            timestamp: now,
            expiresAt: now + oneHour * 4
        });
    }
    
    // UV Extremo
    if (uvi !== undefined && uvi >= 11) {
        alerts.push({
            id: 'uv-extreme',
            type: 'uv',
            level: 'critical',
            title: 'Índice UV Extremo',
            message: 'Nível máximo de radiação UV. Evite exposição ao sol. Proteção FPS 50+ obrigatória se precisar sair.',
            timestamp: now,
            expiresAt: now + oneHour * 4
        });
    } else if (uvi !== undefined && uvi >= 8) {
        alerts.push({
            id: 'uv-high',
            type: 'uv',
            level: 'warning',
            title: 'Índice UV Muito Alto',
            message: 'Proteção solar essencial. Limite a exposição entre 10h e 16h.',
            timestamp: now,
            expiresAt: now + oneHour * 4
        });
    }
    
    // Ventania
    if (windSpeed >= 60) {
        alerts.push({
            id: 'wind-extreme',
            type: 'wind',
            level: 'critical',
            title: 'Ventania',
            message: `Ventos de ${Math.round(windSpeed)} km/h. Perigo de queda de árvores e estruturas. Fique em local seguro.`,
            timestamp: now,
            expiresAt: now + oneHour * 2
        });
    } else if (windSpeed >= 40) {
        alerts.push({
            id: 'wind-high',
            type: 'wind',
            level: 'warning',
            title: 'Vento Forte',
            message: 'Rajadas intensas podem derrubar objetos. Evite ficar perto de placas e árvores.',
            timestamp: now,
            expiresAt: now + oneHour * 2
        });
    }
    
    return alerts;
};

const getAlertStyles = (level: string) => {
    switch (level) {
        case 'critical':
            return { bg: 'bg-red-500/20 border-red-500/50', icon: 'text-red-400', pulse: 'bg-red-500' };
        case 'warning':
            return { bg: 'bg-orange-500/20 border-orange-500/50', icon: 'text-orange-400', pulse: 'bg-orange-500' };
        case 'caution':
            return { bg: 'bg-yellow-500/20 border-yellow-500/50', icon: 'text-yellow-400', pulse: 'bg-yellow-500' };
        default:
            return { bg: 'bg-blue-500/20 border-blue-500/50', icon: 'text-blue-400', pulse: 'bg-blue-500' };
    }
};

const AlertsView: React.FC<AlertsViewProps> = ({ currentWeather, dailyForecast, apiAlerts }) => {
    const { cardClass } = useTheme();
    const { user, isLoggedIn, userData, updateUserData, login } = useAuth();
    const [pushSupported, setPushSupported] = useState(false);
    const [pushSubscribed, setPushSubscribed] = useState(false);
    const [isSubscribing, setIsSubscribing] = useState(false);
    const [pushError, setPushError] = useState<string | null>(null);
    const [isIOS, setIsIOS] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [selectedCity, setSelectedCity] = useState(userData?.preferences?.alertCity || '');

    const localAlerts = useMemo(() => generateLocalAlerts(currentWeather, dailyForecast), [currentWeather, dailyForecast]);

    useEffect(() => {
        setPushSupported(isPushSupported());
        setIsIOS(isIOSSafari());
        setIsInstalled(isPWAInstalled());
        
        const checkSubscription = async () => {
            const { isSubscribed } = await getPushSubscriptionStatus();
            setPushSubscribed(isSubscribed);
        };
        checkSubscription();
    }, []);

    // Sincroniza pushSubscribed com morningSummary quando logado
    useEffect(() => {
        if (isLoggedIn && userData?.preferences?.pushSubscription) {
            setPushSubscribed(true);
        }
    }, [isLoggedIn, userData?.preferences?.pushSubscription]);

    const togglePushNotifications = async () => {
        setPushError(null);
        
        if (pushSubscribed) {
            setIsSubscribing(true);
            const success = await unsubscribeFromPush();
            if (success) {
                setPushSubscribed(false);
                if (isLoggedIn) {
                    await updateUserData({
                        preferences: {
                            ...userData?.preferences,
                            pushSubscription: null,
                            morningSummary: false
                        }
                    });
                }
            }
            setIsSubscribing(false);
        } else {
            setIsSubscribing(true);
            try {
                const subscription = await subscribeToPush();
                setPushSubscribed(true);
                if (subscription && isLoggedIn) {
                    await updateUserData({
                        preferences: {
                            ...userData?.preferences,
                            pushSubscription: subscription,
                            morningSummary: true
                        }
                    });
                }
            } catch (error: any) {
                setPushError(error.message || 'Erro ao ativar notificações');
            } finally {
                setIsSubscribing(false);
            }
        }
    };

    const handleTestNotification = async () => {
        try {
            await sendTestNotification();
        } catch (error: any) {
            setPushError(error.message);
        }
    };

    const handleCitySave = async () => {
        if (!selectedCity.trim()) return;
        await updateUserData({
            preferences: {
                ...userData?.preferences,
                alertCity: selectedCity.trim()
            }
        });
    };

    const activeLocalAlerts = localAlerts.filter(alert => Date.now() <= alert.expiresAt);
    const allAlerts = [...activeLocalAlerts];
    
    if (apiAlerts && apiAlerts.length > 0) {
        apiAlerts.forEach((apiAlert, index) => {
            allAlerts.push({
                id: `api-${index}`,
                type: 'storm',
                level: 'warning',
                title: apiAlert.event,
                message: apiAlert.description,
                timestamp: apiAlert.start * 1000,
                expiresAt: apiAlert.end * 1000
            });
        });
    }

    // Notificações locais para alertas críticos
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'granted') {
            const criticalAlerts = allAlerts.filter(a => a.level === 'critical' || a.level === 'warning');
            criticalAlerts.forEach(alert => {
                const notifiedKey = `notified_${alert.id}`;
                if (!localStorage.getItem(notifiedKey)) {
                    new Notification('Meteor - Alerta Meteorológico', {
                        body: `${alert.title}: ${alert.message}`,
                        icon: '/favicon.svg',
                        tag: alert.id,
                        requireInteraction: alert.level === 'critical'
                    });
                    localStorage.setItem(notifiedKey, Date.now().toString());
                    setTimeout(() => localStorage.removeItem(notifiedKey), alert.expiresAt - Date.now());
                }
            });
        }
    }, [allAlerts]);

    const isMorningSummaryEnabled = isLoggedIn && userData?.preferences?.morningSummary;

    return (
        <div className="h-full overflow-y-auto pb-24 pt-16 lg:pb-6">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
                
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-red-500/20">
                            <BellIcon className="w-6 h-6 text-red-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">Alertas</h2>
                            <p className="text-sm text-gray-400">Monitoramento meteorológico ativo</p>
                        </div>
                    </div>
                </div>

                {/* Alertas Ativos */}
                {allAlerts.length > 0 ? (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-gray-300">Alertas Ativos ({allAlerts.length})</h3>
                            <span className="text-xs text-gray-500">Atualizado agora</span>
                        </div>
                        
                        {allAlerts.map(alert => {
                            const styles = getAlertStyles(alert.level);
                            return (
                                <div key={alert.id} className={`${styles.bg} border rounded-2xl p-4 animate-enter`}>
                                    <div className="flex items-start gap-3">
                                        <div className="relative flex-shrink-0 mt-1">
                                            <span className="relative flex h-3 w-3">
                                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${styles.pulse} opacity-75`}></span>
                                                <span className={`relative inline-flex rounded-full h-3 w-3 ${styles.pulse}`}></span>
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-bold text-white">{alert.title}</h4>
                                                <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                                                    alert.level === 'critical' ? 'bg-red-500 text-white' :
                                                    alert.level === 'warning' ? 'bg-orange-500 text-white' :
                                                    'bg-yellow-500 text-black'
                                                }`}>
                                                    {alert.level === 'critical' ? 'Crítico' : 
                                                     alert.level === 'warning' ? 'Alerta' : 'Atenção'}
                                                </span>
                                            </div>
                                            <p className="text-gray-200 text-sm leading-relaxed">{alert.message}</p>
                                            <p className="text-xs text-gray-400 mt-2">
                                                Expira em: {new Date(alert.expiresAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className={`${cardClass} rounded-3xl p-8 text-center`}>
                        <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <InfoIcon className="w-8 h-8 text-emerald-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">Nenhum Alerta Ativo</h3>
                        <p className="text-gray-400 text-sm">
                            Não há alertas meteorológicos para sua região no momento.
                        </p>
                    </div>
                )}

                {/* Configuração de Notificações Push - Integrada */}
                {pushSupported && (
                    <div className={`${cardClass} rounded-2xl p-5`}>
                        <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
                            <SmartphoneIcon className="w-4 h-4 text-purple-400" />
                            Notificações Push
                        </h4>
                        
                        {isIOS && !isInstalled ? (
                            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                                <p className="text-yellow-200 text-sm mb-2"><strong>Instalação necessária</strong></p>
                                <p className="text-gray-400 text-sm">
                                    Para receber notificações no iOS, adicione o Meteor à tela inicial primeiro.
                                </p>
                            </div>
                        ) : !isLoggedIn ? (
                            <div className="space-y-4">
                                <p className="text-gray-400 text-sm">
                                    Ative notificações push para receber alertas meteorológicos e resumos diários.
                                </p>
                                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                                    <p className="text-yellow-200/80 text-sm mb-3">Esta função requer login.</p>
                                    <button
                                        onClick={login}
                                        className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-medium py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                        </svg>
                                        Entrar para ativar
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-white font-medium text-sm">Receber notificações push</p>
                                        <p className="text-gray-500 text-xs">Alertas e resumo diário</p>
                                    </div>
                                    <button
                                        onClick={togglePushNotifications}
                                        disabled={isSubscribing}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
                                            pushSubscribed ? 'bg-purple-500' : 'bg-gray-600'
                                        }`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                            pushSubscribed ? 'translate-x-6' : 'translate-x-1'
                                        }`} />
                                    </button>
                                </div>
                                
                                {pushError && (
                                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                                        <p className="text-red-300 text-xs">{pushError}</p>
                                    </div>
                                )}
                                
                                {/* Resumo Matinal - Aparece quando push está ativo */}
                                {pushSubscribed && (
                                    <div className="animate-enter space-y-4 pt-4 border-t border-white/10">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-white font-medium text-sm">Resumo diário</p>
                                                <p className="text-gray-500 text-xs">Todos os dias às 07:00</p>
                                            </div>
                                            <button
                                                onClick={() => updateUserData({ 
                                                    preferences: { 
                                                        ...userData?.preferences,
                                                        morningSummary: !userData?.preferences?.morningSummary 
                                                    }
                                                })}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                                    isMorningSummaryEnabled ? 'bg-yellow-500' : 'bg-gray-600'
                                                }`}
                                            >
                                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                    isMorningSummaryEnabled ? 'translate-x-6' : 'translate-x-1'
                                                }`} />
                                            </button>
                                        </div>

                                        {isMorningSummaryEnabled && (
                                            <div className="animate-enter space-y-3">
                                                
                                                <div>
                                                    <label className="text-sm text-gray-400 mb-2 block flex items-center gap-1">
                                                        <MapPinIcon className="w-3 h-3" /> Cidade para alertas
                                                    </label>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            value={selectedCity}
                                                            onChange={(e) => setSelectedCity(e.target.value)}
                                                            placeholder="Ex: São Paulo"
                                                            className="flex-1 bg-gray-900/60 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
                                                        />
                                                        <button
                                                            onClick={handleCitySave}
                                                            className="bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 text-yellow-300 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                                                        >
                                                            Salvar
                                                        </button>
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Deixe em branco para usar a localização atual
                                                    </p>
                                                </div>
                                                
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            const response = await fetch('/.netlify/functions/morningAlerts?test=true');
                                                            const result = await response.json();
                                                            if (response.ok && result.success) {
                                                                alert('Resumo de teste enviado!');
                                                            } else {
                                                                alert('Erro: ' + (result.error || 'Tente novamente'));
                                                            }
                                                        } catch (e: any) {
                                                            alert('Erro ao enviar: ' + e.message);
                                                        }
                                                    }}
                                                    className="w-full bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 text-yellow-300 py-2 rounded-xl text-sm font-medium transition-colors"
                                                >
                                                    Enviar resumo de teste
                                                </button>
                                            </div>
                                        )}

                                        <button
                                            onClick={handleTestNotification}
                                            className="w-full bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-300 py-2 rounded-xl text-sm font-medium transition-colors"
                                        >
                                            Testar notificação
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* O que monitoramos */}
                <div className={`${cardClass} rounded-2xl p-5`}>
                    <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
                        <AlertTriangleIcon className="w-4 h-4 text-yellow-400" />
                        O que monitoramos
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { label: 'Tempestades', color: 'text-red-400' },
                            { label: 'Calor Extremo', color: 'text-orange-400' },
                            { label: 'Frio Intenso', color: 'text-cyan-400' },
                            { label: 'Índice UV', color: 'text-purple-400' },
                            { label: 'Ventos Fortes', color: 'text-blue-400' },
                            { label: 'Chuvas Intensas', color: 'text-indigo-400' },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${item.color.replace('text', 'bg')}`}></span>
                                <span className="text-sm text-gray-300">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="text-center text-xs text-gray-500 pt-2">
                    Alertas gerados automaticamente. Consulte fontes oficiais em emergências.
                </div>
            </div>
        </div>
    );
};

export default AlertsView;
