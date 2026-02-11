

import React, { useState, useEffect, useMemo } from 'react';
import type { WeatherData, WeatherAlert } from '../../types';
import { useTheme } from '../context/ThemeContext';
import { AlertTriangleIcon, BellIcon, XIcon, InfoIcon } from '../icons';

interface AlertsViewProps {
    currentWeather?: WeatherData | null;
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

// Alertas gerados baseados nas condicoes atuais
const generateLocalAlerts = (weather: WeatherData | null | undefined): LocalAlert[] => {
    if (!weather) return [];
    
    const alerts: LocalAlert[] = [];
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    
    const condition = weather.condition?.toLowerCase() || '';
    const temp = weather.temperature;
    const feelsLike = weather.feels_like ?? temp;
    const windSpeed = weather.windSpeed;
    const uvi = weather.uvi;
    
    // Tempestade
    if (condition.includes('tempestade') || condition.includes('trovoada')) {
        alerts.push({
            id: 'storm-current',
            type: 'storm',
            level: 'critical',
            title: 'Tempestade em Andamento',
            message: 'Raios e trovoes detectados na sua regiao. Fique em local fechado e evite areas abertas.',
            timestamp: now,
            expiresAt: now + oneHour
        });
    }
    
    // Chuva forte
    else if (condition.includes('chuva forte') || condition.includes('heavy rain')) {
        alerts.push({
            id: 'rain-heavy',
            type: 'rain',
            level: 'warning',
            title: 'Chuva Intensa',
            message: 'Precipitacao intensa pode causar alagamentos. Evite sair e nao estacione em areas baixas.',
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
            message: `Sensacao termica de ${Math.round(feelsLike)}°C. Risco de insolacao. Evite sol das 10h as 16h, beba muita agua.`,
            timestamp: now,
            expiresAt: now + oneHour * 6
        });
    } else if (feelsLike >= 35) {
        alerts.push({
            id: 'heat-high',
            type: 'heat',
            level: 'warning',
            title: 'Calor Intenso',
            message: `Sensacao de ${Math.round(feelsLike)}°C. Hidrate-se constantemente e busque ambientes refrigerados.`,
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
            message: `Sensacao de ${Math.round(feelsLike)}°C. Risco de hipotermia. Agasalhe-se bem e evite exposicao prolongada.`,
            timestamp: now,
            expiresAt: now + oneHour * 6
        });
    } else if (feelsLike <= 8) {
        alerts.push({
            id: 'cold-high',
            type: 'cold',
            level: 'caution',
            title: 'Temperatura Baixa',
            message: 'Frio significativo. Use varias camadas de roupa ao sair.',
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
            title: 'Indice UV Extremo',
            message: 'Nivel maximo de radiacao UV. Evite exposicao ao sol. Protecao FPS 50+ obrigatoria se precisar sair.',
            timestamp: now,
            expiresAt: now + oneHour * 4
        });
    } else if (uvi !== undefined && uvi >= 8) {
        alerts.push({
            id: 'uv-high',
            type: 'uv',
            level: 'warning',
            title: 'Indice UV Muito Alto',
            message: 'Protecao solar essencial. Limite a exposicao entre 10h e 16h.',
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
            message: `Ventos de ${Math.round(windSpeed)} km/h. Perigo de queda de arvores e estruturas. Fique em local seguro.`,
            timestamp: now,
            expiresAt: now + oneHour * 2
        });
    } else if (windSpeed >= 40) {
        alerts.push({
            id: 'wind-high',
            type: 'wind',
            level: 'warning',
            title: 'Vento Forte',
            message: 'Rajadas intensas podem derrubar objetos. Evite ficar perto de placas e arvores.',
            timestamp: now,
            expiresAt: now + oneHour * 2
        });
    }
    
    return alerts;
};

const getAlertStyles = (level: string) => {
    switch (level) {
        case 'critical':
            return {
                bg: 'bg-red-500/20 border-red-500/50',
                icon: 'text-red-400',
                pulse: 'bg-red-500'
            };
        case 'warning':
            return {
                bg: 'bg-orange-500/20 border-orange-500/50',
                icon: 'text-orange-400',
                pulse: 'bg-orange-500'
            };
        case 'caution':
            return {
                bg: 'bg-yellow-500/20 border-yellow-500/50',
                icon: 'text-yellow-400',
                pulse: 'bg-yellow-500'
            };
        default:
            return {
                bg: 'bg-blue-500/20 border-blue-500/50',
                icon: 'text-blue-400',
                pulse: 'bg-blue-500'
            };
    }
};

const AlertsView: React.FC<AlertsViewProps> = ({ currentWeather, apiAlerts }) => {
    const { cardClass, classes, density } = useTheme();
    const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);

    // Carregar alertas dispensados do localStorage
    useEffect(() => {
        const saved = localStorage.getItem('meteor_dismissed_alerts');
        if (saved) {
            try {
                setDismissedAlerts(JSON.parse(saved));
            } catch (e) {}
        }
    }, []);

    // Salvar alertas dispensados
    const dismissAlert = (alertId: string) => {
        const updated = [...dismissedAlerts, alertId];
        setDismissedAlerts(updated);
        localStorage.setItem('meteor_dismissed_alerts', JSON.stringify(updated));
    };

    // Gerar alertas locais
    const localAlerts = useMemo(() => {
        return generateLocalAlerts(currentWeather);
    }, [currentWeather]);

    // Filtrar alertas dispensados e expirados
    const activeLocalAlerts = localAlerts.filter(alert => {
        if (dismissedAlerts.includes(alert.id)) return false;
        if (Date.now() > alert.expiresAt) return false;
        return true;
    });

    // Combinar com alertas da API (OpenWeather)
    const allAlerts = [...activeLocalAlerts];
    
    // Adicionar alertas da API se existirem
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

    // Solicitar permissao de notificacao
    const requestNotificationPermission = async () => {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            setNotificationsEnabled(permission === 'granted');
        }
    };

    // Enviar notificacao push para alertas criticos/importantes
    useEffect(() => {
        if (notificationsEnabled && 'Notification' in window) {
            const criticalAlerts = allAlerts.filter(a => a.level === 'critical' || a.level === 'warning');
            criticalAlerts.forEach(alert => {
                // Verificar se ja notificamos sobre este alerta
                const notifiedKey = `notified_${alert.id}`;
                if (!localStorage.getItem(notifiedKey)) {
                    new Notification('Meteor - Alerta Meteorológico', {
                        body: `${alert.title}: ${alert.message}`,
                        icon: '/favicon.svg',
                        badge: '/favicon.svg',
                        tag: alert.id,
                        requireInteraction: alert.level === 'critical'
                    });
                    localStorage.setItem(notifiedKey, Date.now().toString());
                    
                    // Limpar notificacao apos expirar
                    setTimeout(() => {
                        localStorage.removeItem(notifiedKey);
                    }, alert.expiresAt - Date.now());
                }
            });
        }
    }, [allAlerts, notificationsEnabled]);

    return (
        <div className="h-full overflow-y-auto pb-24 pt-16 lg:pb-6">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
                
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl bg-red-500/20`}>
                            <BellIcon className="w-6 h-6 text-red-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">Alertas</h2>
                            <p className="text-sm text-gray-400">Monitoramento meteorologico ativo</p>
                        </div>
                    </div>
                    
                    {/* Botão de Notificações */}
                    {'Notification' in window && (
                        <button
                            onClick={requestNotificationPermission}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                notificationsEnabled 
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                            }`}
                        >
                            {notificationsEnabled ? 'Notificações Ativas' : 'Ativar Notificações'}
                        </button>
                    )}
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
                                <div 
                                    key={alert.id} 
                                    className={`${styles.bg} border rounded-2xl p-4 animate-enter relative`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="relative flex-shrink-0">
                                            <span className={`relative flex h-3 w-3`}>
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
                                                    {alert.level === 'critical' ? 'Critico' : 
                                                     alert.level === 'warning' ? 'Alerta' : 'Atencao'}
                                                </span>
                                            </div>
                                            <p className="text-gray-200 text-sm leading-relaxed">
                                                {alert.message}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-2">
                                                Expira em: {new Date(alert.expiresAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                        
                                        <button 
                                            onClick={() => dismissAlert(alert.id)}
                                            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
                                            title="Dispensar alerta"
                                        >
                                            <XIcon className="w-4 h-4 text-gray-400" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    /* Sem Alertas */
                    <div className={`${cardClass} rounded-3xl p-8 text-center`}>
                        <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <InfoIcon className="w-8 h-8 text-emerald-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">Nenhum Alerta Ativo</h3>
                        <p className="text-gray-400 text-sm">
                            Nao ha alertas meteorologicos para sua regiao no momento.
                            <br />
                            As condicoes estao estaveis.
                        </p>
                    </div>
                )}

                {/* Informações de Monitoramento */}
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
                            { label: 'Indice UV', color: 'text-purple-400' },
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

                {/* Disclaimer */}
                <div className="text-center text-xs text-gray-500 pt-2">
                    Alertas sao gerados automaticamente baseados nos dados meteorologicos.
                    <br />
                    Sempre consulte fontes oficiais em situações de emergência.
                </div>
            </div>
        </div>
    );
};

export default AlertsView;
