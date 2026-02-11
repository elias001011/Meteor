
import type { ChatMessage, ChatSession } from '../types';

const CHAT_SESSIONS_KEY = 'meteor_chat_sessions';
const CURRENT_SESSION_KEY = 'meteor_current_session';

// Extrai título da primeira mensagem do usuário se a IA retornar chat_title:
export const extractChatTitle = (aiResponse: string): { title: string | null; cleanResponse: string } => {
    const titleMatch = aiResponse.match(/chat_title:\s*([^\n]+)/i);
    if (titleMatch) {
        const title = titleMatch[1].trim();
        // Remove a linha chat_title: da resposta
        const cleanResponse = aiResponse.replace(/chat_title:\s*[^\n]+\n?/i, '').trim();
        return { title, cleanResponse };
    }
    return { title: null, cleanResponse: aiResponse };
};

// Gera um título baseado na primeira mensagem do usuário
export const generateChatTitle = (firstUserMessage: string): string => {
    // Limita a 30 caracteres e adiciona reticências se necessário
    const maxLength = 30;
    const trimmed = firstUserMessage.trim();
    if (trimmed.length <= maxLength) return trimmed;
    return trimmed.substring(0, maxLength) + '...';
};

// Carrega todas as sessões de chat
export const loadChatSessions = (): ChatSession[] => {
    try {
        const stored = localStorage.getItem(CHAT_SESSIONS_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.error('Erro ao carregar sessões de chat:', e);
    }
    return [];
};

// Salva todas as sessões de chat
export const saveChatSessions = (sessions: ChatSession[]): void => {
    try {
        localStorage.setItem(CHAT_SESSIONS_KEY, JSON.stringify(sessions));
    } catch (e) {
        console.error('Erro ao salvar sessões de chat:', e);
    }
};

// Carrega a sessão atual
export const loadCurrentSession = (): ChatSession | null => {
    try {
        const stored = localStorage.getItem(CURRENT_SESSION_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.error('Erro ao carregar sessão atual:', e);
    }
    return null;
};

// Salva a sessão atual
export const saveCurrentSession = (session: ChatSession | null): void => {
    try {
        if (session) {
            localStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(session));
        } else {
            localStorage.removeItem(CURRENT_SESSION_KEY);
        }
    } catch (e) {
        console.error('Erro ao salvar sessão atual:', e);
    }
};

// Cria uma nova sessão de chat
export const createNewSession = (): ChatSession => {
    const now = Date.now();
    return {
        id: `session_${now}`,
        title: 'Nova conversa',
        messages: [],
        createdAt: now,
        updatedAt: now,
    };
};

// Adiciona mensagem à sessão atual
export const addMessageToSession = (
    session: ChatSession, 
    message: ChatMessage, 
    isFirstMessage: boolean = false
): ChatSession => {
    const updatedMessages = [...session.messages, { ...message, timestamp: Date.now() }];
    
    // Se for a primeira mensagem do usuário, atualiza o título
    let updatedTitle = session.title;
    if (isFirstMessage && message.role === 'user') {
        updatedTitle = generateChatTitle(message.text);
    }
    
    return {
        ...session,
        title: updatedTitle,
        messages: updatedMessages,
        updatedAt: Date.now(),
    };
};

// Atualiza o título de uma sessão
export const updateSessionTitle = (session: ChatSession, newTitle: string): ChatSession => {
    return {
        ...session,
        title: newTitle.trim() || 'Conversa sem título',
        updatedAt: Date.now(),
    };
};

// Deleta uma sessão
export const deleteSession = (sessionId: string): void => {
    const sessions = loadChatSessions();
    const filtered = sessions.filter(s => s.id !== sessionId);
    saveChatSessions(filtered);
};

// Salva a sessão atual na lista de sessões
export const saveCurrentSessionToHistory = (): void => {
    const currentSession = loadCurrentSession();
    if (!currentSession || currentSession.messages.length === 0) return;
    
    const sessions = loadChatSessions();
    const existingIndex = sessions.findIndex(s => s.id === currentSession.id);
    
    if (existingIndex >= 0) {
        // Atualiza sessão existente
        sessions[existingIndex] = currentSession;
    } else {
        // Adiciona nova sessão no início
        sessions.unshift(currentSession);
    }
    
    // Limita a 50 sessões
    if (sessions.length > 50) {
        sessions.pop();
    }
    
    saveChatSessions(sessions);
};

// Renomeia uma sessão no histórico
export const renameSession = (sessionId: string, newTitle: string): void => {
    const sessions = loadChatSessions();
    const sessionIndex = sessions.findIndex(s => s.id === sessionId);
    
    if (sessionIndex >= 0) {
        sessions[sessionIndex] = {
            ...sessions[sessionIndex],
            title: newTitle.trim() || 'Conversa sem título',
            updatedAt: Date.now(),
        };
        saveChatSessions(sessions);
    }
};

// Carrega uma sessão específica do histórico
export const loadSessionFromHistory = (sessionId: string): ChatSession | null => {
    const sessions = loadChatSessions();
    return sessions.find(s => s.id === sessionId) || null;
};

// Limpa todo o histórico
export const clearAllChatHistory = (): void => {
    localStorage.removeItem(CHAT_SESSIONS_KEY);
    localStorage.removeItem(CURRENT_SESSION_KEY);
};
