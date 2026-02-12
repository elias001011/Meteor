import React, { useState, useEffect, useMemo } from 'react';
import type { WeatherData, WeatherAlert } from '../../types';
import { useTheme } from '../context/ThemeContext';
import { AlertTriangleIcon, BellIcon, InfoIcon, MapPinIcon } from '../icons';
import { 
  isPushSupported, 
  subscribeToPush, 
  unsubscribeFromPush, 
  getPushStatus,
  sendTestNotification
} from '../../services/pushService';

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

// Cidade padrão
const DEFAULT_CITY = 'Porto Alegre';

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
    
    // Estados do push
    const [pushSupported, setPushSupported] = useState(false);
    const [pushEnabled, setPushEnabled] = useState(false);
    const [pushCity, setPushCity] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [pushMessage, setPushMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

    const localAlerts = useMemo(() => generateLocalAlerts(currentWeather, dailyForecast), [currentWeather, dailyForecast]);

    // Inicializa cidade padrão
    useEffect(() => {
        const initPush = async () => {
            // Verifica suporte
            setPushSupported(isPushSupported());
            
            // Busca cidade salva ou define padrão
            const savedCity = localStorage.getItem('meteor_push_city');
            if (savedCity) {
                setPushCity(savedCity);
            } else {
                // Tenta cidade atual ou última localização
                const lastCity = localStorage.getItem('last_city');
                
                if (lastCity) {
                    setPushCity(lastCity);
                } else if (currentWeather?.city) {
                    setPushCity(currentWeather.city);
                } else {
                    setPushCity(DEFAULT_CITY);
                }
            }
            
            // Verifica status atual - só ativa se localStorage confirmar
            const localEnabled = localStorage.getItem('meteor_push_enabled');
            if (localEnabled === 'true') {
                try {
                    const status = await getPushStatus();
                    setPushEnabled(status.isSubscribed);
                    // Se não tem subscription mais, limpa
                    if (!status.isSubscribed) {
                        localStorage.removeItem('meteor_push_enabled');
                    }
                } catch (e) {
                    console.warn('Erro ao verificar status do push:', e);
                    setPushEnabled(false);
                }
            } else {
                // Garante que começa desativado
                setPushEnabled(false);
                // Limpa qualquer subscription perdida
                try {
                    const registration = await navigator.serviceWorker?.ready;
                    const subscription = await registration?.pushManager?.getSubscription();
                    if (subscription) {
                        await subscription.unsubscribe();
                        console.log('[Push] Subscription antiga limpa');
                    }
                } catch (e) {
                    // Ignora erro
                }
            }
        };
        
        initPush();
    }, []); // Roda uma vez só no mount

    const handleTogglePush = async () => {
        setPushMessage(null);
        setIsLoading(true);
        
        try {
            if (pushEnabled) {
                // Desativa
                await unsubscribeFromPush();
                setPushEnabled(false);
                setPushMessage({ type: 'success', text: 'Notificações desativadas' });
            } else {
                // Ativa
                const city = pushCity.trim() || DEFAULT_CITY;
                await subscribeToPush(city);
                setPushEnabled(true);
                setPushMessage({ type: 'success', text: 'Notificações ativadas! Você receberá o resumo às 9h.' });
                localStorage.setItem('meteor_push_city', city);
            }
        } catch (error: any) {
            console.error('Erro no toggle push:', error);
            setPushMessage({ type: 'error', text: error.message || 'Erro ao ativar notificações' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleTestNotification = async () => {
        setPushMessage(null);
        setIsLoading(true);
        
        try {
            await sendTestNotification();
            setPushMessage({ type: 'success', text: 'Notificação de teste enviada!' });
        } catch (error: any) {
            setPushMessage({ type: 'error', text: error.message || 'Erro ao enviar teste' });
        } finally {
            setIsLoading(false);
        }
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

                {/* Card de Notificações Push */}
                {pushSupported && (
                    <div className={`${cardClass} rounded-2xl p-5 border border-purple-500/20`}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-xl bg-purple-500/20">
                                <BellIcon className="w-5 h-5 text-purple-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white">Notificações Diárias</h3>
                                <p className="text-xs text-gray-400">Resumo do clima todas as manhãs</p>
                            </div>
                        </div>

                        {/* Descrição */}
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 mb-4">
                            <p className="text-sm text-blue-200">
                                <strong>📱 Como funciona:</strong> Todos os dias às <strong>9:00 da manhã</strong> você receberá uma notificação com o resumo do clima da cidade escolhida. Se houver alertas meteorológicos oficiais, você receberá em notificações separadas.
                            </p>
                            <p className="text-xs text-gray-400 mt-2">
                                Funciona mesmo com o app fechado! 🔒
                            </p>
                        </div>

                        {/* Cidade */}
                        <div className="mb-4">
                            <label className="text-sm text-gray-300 mb-2 block flex items-center gap-2">
                                <MapPinIcon className="w-4 h-4" />
                                Cidade para notificações
                            </label>
                            <input
                                type="text"
                                value={pushCity}
                                onChange={(e) => setPushCity(e.target.value)}
                                disabled={pushEnabled || isLoading}
                                placeholder="Ex: Porto Alegre"
                                className="w-full bg-gray-900/60 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                {pushEnabled 
                                    ? 'Desative para alterar a cidade' 
                                    : 'Padrão: Porto Alegre (se não houver localização)'}
                            </p>
                        </div>

                        {/* Botões */}
                        <div className="flex gap-3">
                            <button
                                onClick={handleTogglePush}
                                disabled={isLoading}
                                className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all disabled:opacity-50 ${
                                    pushEnabled 
                                        ? 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30' 
                                        : 'bg-purple-500 hover:bg-purple-600 text-white'
                                }`}
                            >
                                {isLoading ? 'Processando...' : pushEnabled ? 'Desativar notificações' : 'Ativar notificações'}
                            </button>
                            
                            {pushEnabled && (
                                <button
                                    onClick={handleTestNotification}
                                    disabled={isLoading}
                                    className="px-4 py-3 rounded-xl bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium transition-all disabled:opacity-50"
                                >
                                    Testar
                                </button>
                            )}
                        </div>

                        {/* Mensagem */}
                        {pushMessage && (
                            <div className={`mt-3 p-3 rounded-xl text-sm ${
                                pushMessage.type === 'success' 
                                    ? 'bg-green-500/10 border border-green-500/20 text-green-300' 
                                    : 'bg-red-500/10 border border-red-500/20 text-red-300'
                            }`}>
                                {pushMessage.text}
                            </div>
                        )}

                        {/* Status */}
                        <div className="mt-3 flex items-center gap-2 text-xs">
                            <span className={`w-2 h-2 rounded-full ${pushEnabled ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
                            <span className={pushEnabled ? 'text-green-400' : 'text-gray-400'}>
                                {pushEnabled ? 'Notificações ativas' : 'Notificações desativadas'}
                            </span>
                        </div>
                    </div>
                )}

                <div className="text-center text-xs text-gray-500 pt-2">
                    Alertas gerados automaticamente. Consulte fontes oficiais em emergências.
                </div>
            </div>
        </div>
    );
};

export default AlertsView;
