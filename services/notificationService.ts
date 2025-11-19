
import type { AppNotification, NotificationConfig, NotificationOptionsExperimental, AllWeatherData, WeatherAlert } from '../types';
import { fetchAllWeatherData } from './weatherService';

const NOTIFICATIONS_KEY = 'meteor_notifications';

// Helper to access TimestampTrigger globally since it's experimental
declare global {
    var TimestampTrigger: any;
}

export const getNotifications = (): AppNotification[] => {
    try {
        const stored = localStorage.getItem(NOTIFICATIONS_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        return [];
    }
};

export const saveNotifications = (notifications: AppNotification[]) => {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
};

export const addNotification = (notification: AppNotification, historyEnabled: boolean = true) => {
    // If history is disabled, we don't save to localStorage, but we still return list for UI update if needed
    if (!historyEnabled) return getNotifications();

    const current = getNotifications();
    // Avoid duplicates by ID
    if (current.some(n => n.id === notification.id)) return current;

    const updated = [notification, ...current].slice(0, 50);
    saveNotifications(updated);
    return updated;
};

export const markAllAsRead = () => {
    const current = getNotifications();
    const updated = current.map(n => ({ ...n, read: true }));
    saveNotifications(updated);
    return updated;
};

export const deleteAllNotifications = () => {
    saveNotifications([]);
    return [];
};

/**
 * Determines if two sets of coordinates are roughly the same location (within ~11km)
 * Used for Smart Reuse logic.
 */
const areCoordsClose = (lat1: number, lon1: number, lat2?: number, lon2?: number): boolean => {
    if (lat2 === undefined || lon2 === undefined) return false;
    return Math.abs(lat1 - lat2) < 0.1 && Math.abs(lon1 - lon2) < 0.1;
};

/**
 * Checks if the browser supports Notification Triggers (Offline Scheduling)
 */
export const supportsOfflineNotifications = (): boolean => {
    // @ts-ignore
    return 'showTrigger' in Notification.prototype;
};

/**
 * Schedules notifications using the Service Worker Trigger API (Offline Strategy).
 * This strategy ALWAYS uses Open-Meteo to prevent API costs in background processes.
 */
export const scheduleNotifications = async (config: NotificationConfig) => {
    if (!config.enabled || !('serviceWorker' in navigator)) return;

    try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (!registration) return;

        if (!supportsOfflineNotifications()) {
            console.log("[Notification] Browser does not support Offline Triggers. Relying on Runtime checks.");
            return; 
        }

        // 1. Calculate Next Trigger Time
        const now = new Date();
        const [targetHour, targetMinute] = config.time.split(':').map(Number);
        
        let nextDate = new Date();
        nextDate.setHours(targetHour, targetMinute, 0, 0);

        if (nextDate <= now) {
            nextDate.setDate(nextDate.getDate() + 1);
        }

        // Find next valid day
        for (let i = 0; i < 7; i++) {
            if (config.days.includes(nextDate.getDay())) {
                break;
            }
            nextDate.setDate(nextDate.getDate() + 1);
        }
        
        const triggerTimestamp = nextDate.getTime();
        
        let lat, lon, name;
        if (config.location) {
            lat = config.location.lat; lon = config.location.lon; name = config.location.name;
        } else {
             const lastCoordsStr = localStorage.getItem('last_coords');
             if (lastCoordsStr) {
                 const coords = JSON.parse(lastCoordsStr);
                 lat = coords.lat; lon = coords.lon; name = "Sua Localização";
             } else {
                 return; // Cannot schedule without location
             }
        }

        // For OFFLINE scheduling, force Open-Meteo (Free Source)
        const weatherData = await fetchAllWeatherData(lat, lon, undefined, 'open-meteo');
        
        const targetDayStr = nextDate.toISOString().split('T')[0];
        const forecast = weatherData.dailyForecast.find(d => new Date(d.dt * 1000).toISOString().split('T')[0] === targetDayStr) || weatherData.dailyForecast[0];
        
        const title = `Meteor: Previsão para ${name}`;
        const body = `Previsão: ${Math.round(forecast.temperature)}°C, ${weatherData.weatherData.condition}. Toque para abrir.`;
        
        // Use experimental API
        // @ts-ignore
        const trigger = new TimestampTrigger(triggerTimestamp);

        const notificationOptions: NotificationOptionsExperimental = {
            body: body,
            icon: '/favicon.svg',
            badge: '/favicon.svg',
            tag: 'daily-weather-scheduled', // Using a fixed tag updates/replaces previous schedules
            data: {
                 url: '/',
                 type: 'weather_daily',
                 timestamp: triggerTimestamp
            },
            showTrigger: trigger
        };

        await registration.showNotification(title, notificationOptions);
        console.log(`[Notification] Offline Trigger scheduled for ${nextDate.toLocaleString()}.`);

    } catch (error) {
        console.warn("[Notification] Failed to schedule offline notification:", error);
    }
};

/**
 * Trigger a test notification immediately to verify permissions/style
 */
export const triggerTestNotification = async () => {
    if (Notification.permission !== 'granted') {
        await Notification.requestPermission();
    }
    
    if (Notification.permission === 'granted') {
        new Notification("Teste do Meteor", {
            body: "As notificações estão ativas! ☄️",
            icon: '/favicon.svg'
        });
        return true;
    }
    return false;
};

/**
 * Fallback function called by App.tsx interval (Runtime Strategy).
 * Implements "Smart Reuse" to save API costs.
 */
export const checkAndTriggerRuntime = async (
    config: NotificationConfig, 
    currentWeatherData: AllWeatherData | undefined, // Data currently visible in the App
    addNotificationFn: (n: AppNotification) => void
) => {
    if (!config.enabled) return;
    
    const now = new Date();
    const [targetHour, targetMinute] = config.time.split(':').map(Number);
    
    // Precision check: Match Hour and Minute
    if (now.getHours() !== targetHour || now.getMinutes() !== targetMinute) return;
    if (!config.days.includes(now.getDay())) return;

    // SMART LOCK: Prevent double firing within the same minute/day context
    const todayStr = now.toDateString();
    const locStr = config.location ? `${config.location.lat}_${config.location.lon}` : 'gps';
    const key = `meteor_notif_lock_${todayStr}_${config.time}_${locStr}`;
    
    if (localStorage.getItem(key)) return; // Already triggered today for this config
    localStorage.setItem(key, 'true');

    try {
        let lat, lon, name;
        
        // Resolve coordinates
        if (config.location) {
            lat = config.location.lat; lon = config.location.lon; name = config.location.name;
        } else if (navigator.geolocation) {
             // Try fresh GPS
             try {
                const pos = await new Promise<GeolocationPosition>((resolve, reject) => 
                    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
                );
                lat = pos.coords.latitude; lon = pos.coords.longitude; name = "Sua Localização";
             } catch (e) {
                 // Fallback to stored GPS
                 const lastCoordsStr = localStorage.getItem('last_coords');
                 if (lastCoordsStr) {
                     const coords = JSON.parse(lastCoordsStr);
                     lat = coords.lat; lon = coords.lon; name = "Sua Localização";
                 } else { return; }
             }
        } else { return; }

        let displayTitle = '';
        let displayBody = '';
        let alertData: WeatherAlert[] = [];

        // --- SMART REUSE LOGIC (Cost Saving) ---
        // Check if the data currently loaded in the app matches the notification location
        const canReuseData = currentWeatherData && areCoordsClose(lat, lon, currentWeatherData.weatherData.lat, currentWeatherData.weatherData.lon);

        if (canReuseData && currentWeatherData) {
            // 1. REUSE: We have data in memory (maybe OneCall). Use it! (Cost: $0)
            console.log("[Notification] Runtime: Reusing active app data.");
            const temp = Math.round(currentWeatherData.weatherData.temperature);
            const cond = currentWeatherData.weatherData.condition;
            displayTitle = `Clima Agora em ${name}`;
            displayBody = `${temp}°C, ${cond}.`;
            alertData = currentWeatherData.alerts || [];
            
        } else {
            // 2. FETCH: Locations differ. Fetch specific data but force Open-Meteo (Cost: $0)
            console.log("[Notification] Runtime: Fetching fresh data via Open-Meteo.");
            const data = await fetchAllWeatherData(lat, lon, undefined, 'open-meteo');
            
            displayTitle = `Clima Agora em ${name}`;
            displayBody = `${Math.round(data.weatherData.temperature)}°C, ${data.weatherData.condition}.`;
            alertData = []; // Open-Meteo Free has no alerts
        }

        // Create Internal Notification Object
        const mainNotif: AppNotification = {
            id: `weather_${Date.now()}`,
            title: displayTitle,
            body: displayBody,
            timestamp: Date.now(),
            read: false,
            type: 'weather_daily'
        };
        
        // Add to history (if enabled)
        if (config.historyEnabled) addNotificationFn(mainNotif);

        // Fire System Notification
        if (Notification.permission === 'granted') {
             const reg = await navigator.serviceWorker.getRegistration();
             if (reg) {
                 reg.showNotification(displayTitle, { body: displayBody, icon: '/favicon.svg', badge: '/favicon.svg' });
             } else {
                 new Notification(displayTitle, { body: displayBody, icon: '/favicon.svg' });
             }
        }

        // --- SEPARATE ALERTS LOGIC ---
        if (config.separateAlerts && alertData.length > 0) {
             const alert = alertData[0];
             const alertNotif: AppNotification = {
                id: `alert_${Date.now()}`,
                title: `⚠️ Alerta: ${alert.event}`,
                body: `${alert.description.slice(0, 100)}...`,
                timestamp: Date.now(),
                read: false,
                type: 'alert'
            };
            
            if (config.historyEnabled) addNotificationFn(alertNotif);
            
            if (Notification.permission === 'granted') {
                const reg = await navigator.serviceWorker.getRegistration();
                const opts = { body: alertNotif.body, icon: '/favicon.svg', badge: '/favicon.svg', tag: 'alert_severe' };
                if (reg) reg.showNotification(alertNotif.title, opts);
                else new Notification(alertNotif.title, opts);
            }
        }

    } catch (e) { console.error(e); }
};