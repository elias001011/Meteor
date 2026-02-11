

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { WeatherData, WeatherAlert } from '../../types';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { AlertTriangleIcon, BellIcon, InfoIcon, MailIcon, UserIcon, RefreshCwIcon, SmartphoneIcon, SunIcon } from '../icons';
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
    dailyForecast?: any[];  // Para pegar UV máximo
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

// Alertas gerados baseados nas condições atuais
const generateLocalAlerts = (weather: WeatherData | null | undefined, dailyForecast?: any[]): LocalAlert[] => {
    if (!weather) return [];
    
    const alerts: LocalAlert[] = [];
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    
    const condition = weather.condition?.toLowerCase() || '';
    const temp = weather.temperature;
    const feelsLike = weather.feels_like ?? temp;
    const windSpeed = weather.windSpeed;
    
    // UV: tenta pegar do current, se não tiver, pega do daily forecast
    let uvi = weather.uvi;
    if ((uvi === undefined || uvi === null) && dailyForecast && dailyForecast.length > 0) {
        uvi = dailyForecast[0].uvi;
    }
    
    // Tempestade
    if (condition.includes('tempestade') || condition.includes('trovoada')) {
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
    
    // Chuva forte
    else if (condition.includes('chuva forte') || condition.includes('heavy rain')) {
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

const AlertsView: React.FC<AlertsViewProps> = ({ currentWeather, dailyForecast, apiAlerts }) => {
    const { cardClass, classes, density } = useTheme();
    const { user, isLoggedIn, userData, updateUserData, login, identityError } = useAuth();
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [emailInput, setEmailInput] = useState('');
    const [isSendingEmail, setIsSendingEmail] = useState(false);
    const [emailStatus, setEmailStatus] = useState<{type: 'success' | 'error', message: string} | null>(null);
    const [lastLocation, setLastLocation] = useState<string | null>(null);
    
    // Estados para notificações push
    const [pushSupported, setPushSupported] = useState(false);
    const [pushSubscribed, setPushSubscribed] = useState(false);
    const [isSubscribing, setIsSubscribing] = useState(false);
    const [pushError, setPushError] = useState<string | null>(null);
    const [isIOS, setIsIOS] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [emailServiceConfigured, setEmailServiceConfigured] = useState<boolean | null>(null);

    // Verifica se o serviço de email está configurado
    useEffect(() => {
        const checkEmailService = async () => {
            try {
                const response = await fetch('/.netlify/functions/sendAlertEmails', {
                    method: 'OPTIONS'
                });
                // Se responder 200, o serviço está configurado
                setEmailServiceConfigured(true);
            } catch (error) {
                setEmailServiceConfigured(false);
            }
        };
        checkEmailService();
    }, []);

    // Gerar alertas locais
    const localAlerts = useMemo(() => {
        return generateLocalAlerts(currentWeather, dailyForecast);
    }, [currentWeather, dailyForecast]);

    // Verifica mudança de localização e recarrega alertas
    useEffect(() => {
        const currentLocation = currentWeather?.city;
        if (currentLocation && currentLocation !== lastLocation) {
            setLastLocation(currentLocation);
            // Limpa alertas notificados quando muda a localização
            if (currentLocation) {
                const keys = Object.keys(localStorage).filter(k => k.startsWith('notified_'));
                keys.forEach(k => localStorage.removeItem(k));
            }
        }
    }, [currentWeather?.city, lastLocation]);

    // Verifica suporte a notificações push
    useEffect(() => {
        setPushSupported(isPushSupported());
        setIsIOS(isIOSSafari());
        setIsInstalled(isPWAInstalled());
        
        // Verifica status da inscrição
        const checkSubscription = async () => {
            const { isSubscribed } = await getPushSubscriptionStatus();
            setPushSubscribed(isSubscribed);
        };
        checkSubscription();
    }, []);

    // Handler para ativar/desativar push
    const togglePushNotifications = async () => {
        setPushError(null);
        
        if (pushSubscribed) {
            // Cancela inscrição
            setIsSubscribing(true);
            const success = await unsubscribeFromPush();
            setPushSubscribed(!success);
            setIsSubscribing(false);
        } else {
            // Cria inscrição
            setIsSubscribing(true);
            try {
                await subscribeToPush();
                setPushSubscribed(true);
            } catch (error: any) {
                setPushError(error.message || 'Erro ao ativar notificações');
            } finally {
                setIsSubscribing(false);
            }
        }
    };

    // Handler para testar notificação
    const handleTestNotification = async () => {
        try {
            await sendTestNotification();
        } catch (error: any) {
            setPushError(error.message);
        }
    };

    // Filtrar apenas alertas expirados (sem dispensar - mostrar todos)
    const activeLocalAlerts = localAlerts.filter(alert => {
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

    // Sincronizar email com userData
    useEffect(() => {
        if (userData) {
            setEmailInput(userData.emailAlertAddress || '');
        }
    }, [userData]);

    // Toggle email alerts
    const toggleEmailAlerts = async () => {
        if (!isLoggedIn) {
            login();
            return;
        }
        const newValue = !(userData?.emailAlertsEnabled || false);
        await updateUserData({ emailAlertsEnabled: newValue });
    };

    // Salvar email de alertas
    const saveAlertEmail = async () => {
        if (!isLoggedIn || !emailInput) return;
        await updateUserData({ emailAlertAddress: emailInput });
        setEmailStatus({ type: 'success', message: 'Email salvo!' });
        setTimeout(() => setEmailStatus(null), 3000);
    };

    // Enviar alerta por email
    const sendTestAlert = async () => {
        if (!userData?.emailAlertAddress || !isLoggedIn) return;
        
        setIsSendingEmail(true);
        setEmailStatus(null);
        
        try {
            // Pega o primeiro alerta crítico ou warning
            const alertToSend = allAlerts.find(a => a.level === 'critical' || a.level === 'warning');
            
            if (!alertToSend) {
                setEmailStatus({ type: 'error', message: 'Nenhum alerta ativo para enviar' });
                setIsSendingEmail(false);
                return;
            }

            const response = await fetch('/.netlify/functions/sendAlertEmails', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    to: userData.emailAlertAddress,
                    alertType: alertToSend.type,
                    alertTitle: alertToSend.title,
                    alertMessage: alertToSend.message,
                    location: userData?.preferences?.alertCity || currentWeather?.city || 'Sua cidade',
                }),
            });

            const result = await response.json();

            if (response.ok && result.success) {
                setEmailStatus({ type: 'success', message: 'Alerta enviado para seu email!' });
            } else {
                console.error('Erro ao enviar email:', result);
                setEmailStatus({ type: 'error', message: result.error || result.message || `Erro ${response.status}` });
            }
        } catch (error: any) {
            console.error('Erro de conexão:', error);
            setEmailStatus({ type: 'error', message: `Erro: ${error.message || 'Falha na conexão'}` });
        } finally {
            setIsSendingEmail(false);
            setTimeout(() => setEmailStatus(null), 5000);
        }
    };

    // Enviar notificação push para alertas críticos/importantes
    useEffect(() => {
        if (notificationsEnabled && 'Notification' in window) {
            const criticalAlerts = allAlerts.filter(a => a.level === 'critical' || a.level === 'warning');
            criticalAlerts.forEach(alert => {
                // Verificar se já notificamos sobre este alerta
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
                    
                    // Limpar notificação após expirar
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
                                                    {alert.level === 'critical' ? 'Crítico' : 
                                                     alert.level === 'warning' ? 'Alerta' : 'Atenção'}
                                                </span>
                                            </div>
                                            <p className="text-gray-200 text-sm leading-relaxed">
                                                {alert.message}
                                            </p>
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
                    /* Sem Alertas */
                    <div className={`${cardClass} rounded-3xl p-8 text-center`}>
                        <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <InfoIcon className="w-8 h-8 text-emerald-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">Nenhum Alerta Ativo</h3>
                        <p className="text-gray-400 text-sm">
                            Não há alertas meteorológicos para sua região no momento.
                            <br />
                            As condições estão estáveis.
                        </p>
                    </div>
                )}

                {/* Configuração de Email Alerts */}
                <div className={`${cardClass} rounded-2xl p-5`}>
                    <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
                        <MailIcon className="w-4 h-4 text-blue-400" />
                        Alertas por Email
                    </h4>
                    
                    {emailServiceConfigured === false && (
                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-4">
                            <p className="text-yellow-200 text-sm mb-2">
                                <strong>⚠️ Serviço de email não configurado</strong>
                            </p>
                            <p className="text-gray-400 text-sm">
                                O administrador precisa configurar a variável RESEND_API no Netlify.
                            </p>
                        </div>
                    )}
                    
                    {identityError ? (
                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                            <p className="text-yellow-200 text-sm mb-2">
                                <strong>Serviço Temporariamente Indisponível</strong>
                            </p>
                            <p className="text-gray-400 text-sm">
                                O sistema de autenticação está em manutenção.
                                Tente novamente mais tarde.
                            </p>
                        </div>
                    ) : !isLoggedIn ? (
                        <div className="bg-white/5 rounded-xl p-4 text-center">
                            <UserIcon className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                            <p className="text-sm text-gray-400 mb-3">
                                Faça login para receber alertas meteorológicos por email
                            </p>
                            <button 
                                onClick={login}
                                className={`${classes.bg} hover:brightness-110 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all`}
                            >
                                Entrar / Criar Conta
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Toggle Email Alerts */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-white font-medium text-sm">Receber alertas por email</p>
                                    <p className="text-gray-500 text-xs">Notificações sobre condições críticas</p>
                                </div>
                                <button
                                    onClick={toggleEmailAlerts}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                        userData?.emailAlertsEnabled ? 'bg-blue-500' : 'bg-gray-600'
                                    }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                            userData?.emailAlertsEnabled ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                    />
                                </button>
                            </div>
                            
                            {/* Campo de Email */}
                            {userData?.emailAlertsEnabled && (
                                <div className="animate-enter space-y-3">
                                    <div>
                                        <label className="text-sm text-gray-400 mb-2 block">Cidade para alertas</label>
                                        <input
                                            type="text"
                                            value={userData?.preferences?.alertCity || currentWeather?.city || ''}
                                            onChange={(e) => updateUserData({
                                                preferences: { ...userData?.preferences, alertCity: e.target.value }
                                            })}
                                            placeholder="Digite sua cidade"
                                            className="w-full bg-gray-900/60 border border-white/10 rounded-xl px-4 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Os alertas serão baseados nesta cidade
                                        </p>
                                    </div>
                                    
                                    <div>
                                        <label className="text-sm text-gray-400 mb-2 block">Email para receber alertas</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="email"
                                                value={emailInput}
                                                onChange={(e) => setEmailInput(e.target.value)}
                                                placeholder="seu@email.com"
                                                className="flex-1 bg-gray-900/60 border border-white/10 rounded-xl px-4 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                            />
                                            <button
                                                onClick={saveAlertEmail}
                                                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                                            >
                                                Salvar
                                            </button>
                                        </div>
                                    </div>
                                    
                                    {/* Botão de enviar alerta de teste */}
                                    {allAlerts.length > 0 && (
                                        <button
                                            onClick={sendTestAlert}
                                            disabled={isSendingEmail}
                                            className="w-full mt-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 py-2 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            {isSendingEmail ? (
                                                <RefreshCwIcon className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <MailIcon className="w-4 h-4" />
                                            )}
                                            Enviar alerta atual por email
                                        </button>
                                    )}
                                    
                                    {emailStatus && (
                                        <p className={`text-xs text-center ${
                                            emailStatus.type === 'success' ? 'text-emerald-400' : 'text-red-400'
                                        }`}>
                                            {emailStatus.message}
                                        </p>
                                    )}
                                    
                                    <p className="text-xs text-gray-500">
                                        Logado como: <span className="text-gray-300">{user?.email}</span>
                                    </p>
                                </div>
                            )}
                            

                        </div>
                    )}
                </div>

                {/* Configuração de Notificações Push */}
                {pushSupported && (
                    <div className={`${cardClass} rounded-2xl p-5`}>
                        <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
                            <SmartphoneIcon className="w-4 h-4 text-purple-400" />
                            Notificações Push
                        </h4>
                        
                        {isIOS && !isInstalled ? (
                            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                                <p className="text-yellow-200 text-sm mb-2">
                                    <strong>Instalação necessária</strong>
                                </p>
                                <p className="text-gray-400 text-sm">
                                    Para receber notificações push no iOS, adicione o Meteor à tela inicial primeiro.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-white font-medium text-sm">Receber notificações push</p>
                                        <p className="text-gray-500 text-xs">Funciona mesmo com o app fechado</p>
                                    </div>
                                    <button
                                        onClick={togglePushNotifications}
                                        disabled={isSubscribing}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
                                            pushSubscribed ? 'bg-purple-500' : 'bg-gray-600'
                                        }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                pushSubscribed ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                        />
                                    </button>
                                </div>
                                
                                {pushError && (
                                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                                        <p className="text-red-300 text-xs">{pushError}</p>
                                    </div>
                                )}
                                
                                {pushSubscribed && (
                                    <div className="animate-enter space-y-2">
                                        <button
                                            onClick={handleTestNotification}
                                            className="w-full bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-300 py-2 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                        >
                                            <BellIcon className="w-4 h-4" />
                                            Enviar notificação de teste
                                        </button>
                                        
                                        <p className="text-xs text-gray-500">
                                            Notificações ativas. Você receberá alertas mesmo quando o app estiver fechado.
                                        </p>
                                    </div>
                                )}
                                
                                <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3">
                                    <p className="text-xs text-purple-200/80">
                                        <strong>Funciona offline:</strong> As notificações push são entregues pelo sistema operacional, mesmo quando o app não está aberto.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Resumo Matinal */}
                {isLoggedIn && (
                    <div className={`${cardClass} rounded-2xl p-5`}>
                        <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
                            <SunIcon className="w-4 h-4 text-yellow-400" />
                            Resumo Matinal
                        </h4>
                        
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-white font-medium text-sm">Receber resumo diário</p>
                                    <p className="text-gray-500 text-xs">Previsão do dia e alertas importantes</p>
                                </div>
                                <button
                                    onClick={() => updateUserData({ 
                                        preferences: { 
                                            ...userData?.preferences,
                                            morningSummary: !userData?.preferences?.morningSummary 
                                        }
                                    })}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                        userData?.preferences?.morningSummary ? 'bg-yellow-500' : 'bg-gray-600'
                                    }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                            userData?.preferences?.morningSummary ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                    />
                                </button>
                            </div>
                            
                            {userData?.preferences?.morningSummary && (
                                <div className="animate-enter space-y-3">
                                    <div>
                                        <label className="text-sm text-gray-400 mb-2 block">Horário do resumo</label>
                                        <select
                                            value={userData?.preferences?.summaryTime || '08:00'}
                                            onChange={(e) => updateUserData({
                                                preferences: {
                                                    ...userData?.preferences,
                                                    summaryTime: e.target.value
                                                }
                                            })}
                                            className="w-full bg-gray-900/60 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
                                        >
                                            {['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00'].map(time => (
                                                <option key={time} value={time}>{time}</option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    <p className="text-xs text-yellow-200/60">
                                        💡 O resumo inclui: temperatura máxima/mínima, chance de chuva e alertas governamentais (se houver).
                                    </p>
                                    
                                    <p className="text-xs text-gray-500">
                                        Economia de dados: Uma única verificação por dia no horário selecionado.
                                    </p>
                                </div>
                            )}
                        </div>
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

                {/* Disclaimer */}
                <div className="text-center text-xs text-gray-500 pt-2">
                    Alertas são gerados automaticamente baseados nos dados meteorológicos.
                    <br />
                    Sempre consulte fontes oficiais em situações de emergência.
                </div>
            </div>
        </div>
    );
};

export default AlertsView;
