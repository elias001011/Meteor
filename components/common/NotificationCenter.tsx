
import React from 'react';
import type { AppNotification } from '../../types';
import { XIcon, TrashIcon, CheckDoubleIcon, BellIcon, CloudIcon, AlertTriangleIcon } from '../icons';
import { useTheme } from '../context/ThemeContext';

interface NotificationCenterProps {
    isOpen: boolean;
    onClose: () => void;
    notifications: AppNotification[];
    onMarkAllRead: () => void;
    onDeleteAll: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose, notifications, onMarkAllRead, onDeleteAll }) => {
    const { glassClass, classes } = useTheme();

    if (!isOpen) return null;

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getIcon = (type: string) => {
        switch(type) {
            case 'alert': return <AlertTriangleIcon className="w-5 h-5 text-yellow-500" />;
            case 'weather_daily': return <CloudIcon className="w-5 h-5 text-cyan-500" />;
            default: return <BellIcon className="w-5 h-5 text-gray-400" />;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-[70] flex items-start justify-center sm:justify-end p-4 sm:pt-16 backdrop-blur-sm">
            <div className={`${glassClass} border border-gray-700 rounded-2xl w-full max-w-sm flex flex-col shadow-2xl max-h-[80vh] animate-in slide-in-from-top-4 duration-200`}>
                
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <BellIcon className="w-5 h-5" />
                        Notificações
                        {notifications.filter(n => !n.read).length > 0 && (
                            <span className={`${classes.bg} text-white text-xs px-2 py-0.5 rounded-full`}>
                                {notifications.filter(n => !n.read).length}
                            </span>
                        )}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-700/50">
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {notifications.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">
                            <p>Nenhuma notificação.</p>
                        </div>
                    ) : (
                        notifications.map((notif) => (
                            <div 
                                key={notif.id} 
                                className={`p-3 rounded-xl border transition-colors relative ${notif.read ? 'bg-gray-800/30 border-transparent' : 'bg-gray-800/80 border-gray-600'}`}
                            >
                                {!notif.read && (
                                    <div className={`absolute top-3 right-3 w-2 h-2 rounded-full ${classes.bg}`}></div>
                                )}
                                <div className="flex gap-3">
                                    <div className="mt-1 flex-shrink-0">
                                        {getIcon(notif.type)}
                                    </div>
                                    <div>
                                        <h4 className={`text-sm font-bold ${notif.read ? 'text-gray-400' : 'text-white'}`}>{notif.title}</h4>
                                        <p className="text-sm text-gray-300 mt-1 leading-snug">{notif.body}</p>
                                        <p className="text-xs text-gray-500 mt-2">{formatDate(notif.timestamp)}</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer Actions */}
                {notifications.length > 0 && (
                    <div className="p-3 border-t border-gray-700/50 grid grid-cols-2 gap-3">
                        <button 
                            onClick={onMarkAllRead}
                            className="flex items-center justify-center gap-2 text-xs font-medium text-gray-300 hover:text-white hover:bg-gray-700/50 py-2 rounded-lg transition-colors"
                        >
                            <CheckDoubleIcon className="w-4 h-4" />
                            Marcar Lidas
                        </button>
                        <button 
                            onClick={onDeleteAll}
                            className="flex items-center justify-center gap-2 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 py-2 rounded-lg transition-colors"
                        >
                            <TrashIcon className="w-4 h-4" />
                            Limpar Tudo
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationCenter;