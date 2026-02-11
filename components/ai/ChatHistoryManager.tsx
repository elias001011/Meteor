
import React, { useState, useEffect } from 'react';
import type { ChatSession } from '../../types';
import { 
    loadChatSessions, 
    deleteSession, 
    renameSession, 
    loadSessionFromHistory,
    createNewSession,
    saveCurrentSession,
    saveCurrentSessionToHistory
} from '../../services/chatHistoryService';
import { useTheme } from '../context/ThemeContext';
import { 
    HistoryIcon, 
    XIcon, 
    TrashIcon, 
    EditIcon, 
    PlusIcon,
    MessageSquareIcon,
    ClockIcon
} from '../icons';

interface ChatHistoryManagerProps {
    currentSessionId: string | null;
    onSessionSelect: (session: ChatSession) => void;
    onNewSession: () => void;
    isOpen: boolean;
    onClose: () => void;
}

const ChatHistoryManager: React.FC<ChatHistoryManagerProps> = ({
    currentSessionId,
    onSessionSelect,
    onNewSession,
    isOpen,
    onClose,
}) => {
    const { classes, cardClass, density } = useTheme();
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (isOpen) {
            loadSessions();
        }
    }, [isOpen]);

    const loadSessions = () => {
        const loaded = loadChatSessions();
        setSessions(loaded);
    };

    const handleDelete = (e: React.MouseEvent, sessionId: string) => {
        e.stopPropagation();
        if (confirm('Tem certeza que deseja excluir esta conversa?')) {
            deleteSession(sessionId);
            loadSessions();
        }
    };

    const handleRenameStart = (e: React.MouseEvent, session: ChatSession) => {
        e.stopPropagation();
        setEditingId(session.id);
        setEditTitle(session.title);
    };

    const handleRenameSave = (e: React.MouseEvent | React.KeyboardEvent, sessionId: string) => {
        e.stopPropagation();
        if (editTitle.trim()) {
            renameSession(sessionId, editTitle.trim());
            loadSessions();
        }
        setEditingId(null);
    };

    const handleRenameCancel = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingId(null);
    };

    const handleSessionClick = (session: ChatSession) => {
        // Salva a sessão atual antes de trocar
        saveCurrentSessionToHistory();
        
        // Carrega a sessão selecionada
        const fullSession = loadSessionFromHistory(session.id);
        if (fullSession) {
            saveCurrentSession(fullSession);
            onSessionSelect(fullSession);
        }
        onClose();
    };

    const handleNewSession = () => {
        saveCurrentSessionToHistory();
        const newSession = createNewSession();
        saveCurrentSession(newSession);
        onNewSession();
        onClose();
    };

    const formatDate = (timestamp: number): string => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (days === 0) {
            return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        } else if (days === 1) {
            return 'Ontem';
        } else if (days < 7) {
            return date.toLocaleDateString('pt-BR', { weekday: 'long' });
        } else {
            return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
        }
    };

    const filteredSessions = sessions.filter(session =>
        session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.messages.some(m => m.text.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-enter">
            <div 
                className={`${cardClass} rounded-3xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl border border-gray-700`}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <div className="flex items-center gap-2">
                        <HistoryIcon className="w-5 h-5 text-gray-400" />
                        <h3 className="text-lg font-bold text-white">Histórico de Conversas</h3>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <XIcon className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-white/10">
                    <div className="relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Pesquisar conversas..."
                            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
                        />
                    </div>
                </div>

                {/* New Session Button */}
                <div className="p-3">
                    <button
                        onClick={handleNewSession}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border border-dashed border-gray-600 hover:border-blue-500/50 hover:bg-blue-500/10 transition-all group`}
                    >
                        <div className={`w-8 h-8 rounded-lg ${classes.bg}/20 flex items-center justify-center group-hover:${classes.bg}/30`}>
                            <PlusIcon className={`w-4 h-4 ${classes.text}`} />
                        </div>
                        <span className="text-sm font-medium text-gray-300 group-hover:text-white">
                            Nova conversa
                        </span>
                    </button>
                </div>

                {/* Sessions List */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {filteredSessions.length === 0 ? (
                        <div className="text-center py-8">
                            <MessageSquareIcon className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                            <p className="text-gray-500 text-sm">
                                {searchQuery ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa salva'}
                            </p>
                        </div>
                    ) : (
                        filteredSessions.map((session) => (
                            <div
                                key={session.id}
                                onClick={() => handleSessionClick(session)}
                                className={`group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                                    session.id === currentSessionId 
                                        ? 'bg-blue-500/20 border border-blue-500/30' 
                                        : 'hover:bg-white/5 border border-transparent'
                                }`}
                            >
                                <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center ${
                                    session.id === currentSessionId 
                                        ? `${classes.bg}/30` 
                                        : 'bg-gray-700/50'
                                }`}>
                                    <MessageSquareIcon className={`w-4 h-4 ${
                                        session.id === currentSessionId ? classes.text : 'text-gray-400'
                                    }`} />
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                    {editingId === session.id ? (
                                        <div 
                                            className="flex items-center gap-2"
                                            onClick={e => e.stopPropagation()}
                                        >
                                            <input
                                                type="text"
                                                value={editTitle}
                                                onChange={(e) => setEditTitle(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        handleRenameSave(e, session.id);
                                                    } else if (e.key === 'Escape') {
                                                        setEditingId(null);
                                                    }
                                                }}
                                                autoFocus
                                                className="flex-1 bg-black/50 border border-blue-500/50 rounded px-2 py-1 text-sm text-white focus:outline-none"
                                            />
                                            <button 
                                                onClick={(e) => handleRenameSave(e, session.id)}
                                                className="text-emerald-400 hover:text-emerald-300"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <h4 className="text-sm font-medium text-white truncate">
                                                {session.title}
                                            </h4>
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <ClockIcon className="w-3 h-3" />
                                                {formatDate(session.updatedAt)}
                                                <span className="text-gray-600">•</span>
                                                {session.messages.length} mensagens
                                            </div>
                                        </>
                                    )}
                                </div>

                                {editingId !== session.id && (
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => handleRenameStart(e, session)}
                                            className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white"
                                            title="Renomear"
                                        >
                                            <EditIcon className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={(e) => handleDelete(e, session.id)}
                                            className="p-1.5 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-400"
                                            title="Excluir"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-white/10 text-center">
                    <p className="text-xs text-gray-500">
                        {sessions.length} conversa{sessions.length !== 1 ? 's' : ''} salva{sessions.length !== 1 ? 's' : ''}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ChatHistoryManager;
