
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import netlifyIdentity, { User } from 'netlify-identity-widget';

// Tipos de dados que podem ser sincronizados
export type SyncDataType = 'settings' | 'chatHistory' | 'favoriteCities' | 'weatherCache';

export interface UserData {
  emailAlertsEnabled: boolean;
  emailAlertAddress: string;
  favoriteCities: string[];
  aiChatHistory: { role: 'user' | 'model'; text: string; timestamp: number }[];
  aiConversationsToday: number;
  lastConversationDate: string;
  syncPreferences: Record<SyncDataType, boolean>;
  lastSyncTimestamp: number | null;
  settings: {
    transparencyMode: 'glass' | 'solid';
    reduceMotion: boolean;
    highContrast: boolean;
    dataSource: 'default' | 'openweather' | 'openmeteo';
  };
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  isSyncing: boolean;
  lastSyncTime: number | null;
  identityError: string | null;
  login: () => void;
  logout: () => void;
  signup: () => void;
  deleteAccount: () => Promise<{ success: boolean; error?: string }>;
  updateUserData: (data: Partial<UserData>) => Promise<void>;
  refreshUserData: () => Promise<void>;
  syncToCloud: (force?: boolean) => Promise<{ success: boolean; message: string }>;
  syncFromCloud: () => Promise<{ success: boolean; message: string }>;
  updateSyncPreferences: (prefs: Record<SyncDataType, boolean>) => Promise<void>;
  hasPendingSync: boolean;
}

const defaultSyncPreferences: Record<SyncDataType, boolean> = {
  settings: true,
  chatHistory: true,
  favoriteCities: true,
  weatherCache: false, // Cache geralmente não precisa sincronizar
};

const defaultUserData: UserData = {
  emailAlertsEnabled: false,
  emailAlertAddress: '',
  favoriteCities: [],
  aiChatHistory: [],
  aiConversationsToday: 0,
  lastConversationDate: new Date().toISOString().split('T')[0],
  syncPreferences: defaultSyncPreferences,
  lastSyncTimestamp: null,
  settings: {
    transparencyMode: 'glass',
    reduceMotion: false,
    highContrast: false,
    dataSource: 'default',
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// URL do site Netlify - usa a origem atual
const NETLIFY_SITE_URL = typeof window !== 'undefined' ? window.location.origin : '';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [identityError, setIdentityError] = useState<string | null>(null);
  const [hasPendingSync, setHasPendingSync] = useState(false);

  // Inicializa o Netlify Identity
  useEffect(() => {
    try {
      netlifyIdentity.init({
        APIUrl: `${NETLIFY_SITE_URL}/.netlify/identity`,
        logo: true,
      });
    } catch (error) {
      console.error('Erro ao inicializar Netlify Identity:', error);
      setIdentityError('Serviço de autenticação temporariamente indisponível');
    }

    // Carrega usuário atual se existir
    const currentUser = netlifyIdentity.currentUser();
    if (currentUser) {
      setUser(currentUser);
      loadUserData(currentUser);
    }
    setIsLoading(false);

    // Event listeners
    netlifyIdentity.on('login', (user) => {
      setUser(user);
      loadUserData(user);
      netlifyIdentity.close();
    });

    netlifyIdentity.on('logout', () => {
      setUser(null);
      setUserData(null);
      setLastSyncTime(null);
      // Não limpa localStorage ao fazer logout para permitir uso offline
    });

    netlifyIdentity.on('signup', (user) => {
      setUser(user);
      // Cria dados iniciais do usuário
      initializeUserData(user);
      netlifyIdentity.close();
    });

    return () => {
      netlifyIdentity.off('login');
      netlifyIdentity.off('logout');
      netlifyIdentity.off('signup');
    };
  }, []);

  // Verifica mudanças locais pendentes de sincronização
  useEffect(() => {
    if (!user) return;
    
    const checkPendingChanges = () => {
      const pending = localStorage.getItem('meteor_sync_pending');
      setHasPendingSync(pending === 'true');
    };
    
    checkPendingChanges();
    const interval = setInterval(checkPendingChanges, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const loadUserData = async (currentUser: User) => {
    try {
      // Tenta carregar da nuvem primeiro (via Netlify Function)
      const response = await fetch('/.netlify/functions/getUserData', {
        headers: {
          Authorization: `Bearer ${currentUser.token?.access_token}`,
        },
      });

      if (response.ok) {
        const cloudData = await response.json();
        const mergedData = { 
          ...defaultUserData, 
          ...cloudData,
          syncPreferences: { ...defaultSyncPreferences, ...cloudData.syncPreferences }
        };
        setUserData(mergedData);
        setLastSyncTime(cloudData.lastSyncTimestamp || Date.now());
        // Salva backup local
        localStorage.setItem('meteor_user_data', JSON.stringify(mergedData));
        localStorage.removeItem('meteor_sync_pending');
      } else {
        // Fallback para localStorage
        const localData = localStorage.getItem('meteor_user_data');
        if (localData) {
          const parsed = JSON.parse(localData);
          setUserData({ ...defaultUserData, ...parsed });
        } else {
          setUserData(defaultUserData);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
      // Fallback para localStorage
      const localData = localStorage.getItem('meteor_user_data');
      if (localData) {
        setUserData({ ...defaultUserData, ...JSON.parse(localData) });
      } else {
        setUserData(defaultUserData);
      }
    }
  };

  const initializeUserData = async (newUser: User) => {
    const initialData = {
      ...defaultUserData,
      emailAlertAddress: newUser.email || '',
      lastSyncTimestamp: Date.now(),
    };
    setUserData(initialData);
    
    try {
      await fetch('/.netlify/functions/saveUserData', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${newUser.token?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(initialData),
      });
    } catch (error) {
      console.error('Erro ao inicializar dados do usuário:', error);
    }
  };

  const updateUserData = useCallback(async (data: Partial<UserData>) => {
    if (!user || !userData) return;

    const newData = { ...userData, ...data };
    setUserData(newData);

    // Salva localmente como backup
    localStorage.setItem('meteor_user_data', JSON.stringify(newData));
    localStorage.setItem('meteor_sync_pending', 'true');
    setHasPendingSync(true);

    // Tenta salvar na nuvem silenciosamente
    try {
      await fetch('/.netlify/functions/saveUserData', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${user.token?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...newData, lastSyncTimestamp: Date.now() }),
      });
      localStorage.removeItem('meteor_sync_pending');
      setHasPendingSync(false);
      setLastSyncTime(Date.now());
    } catch (error) {
      console.error('Erro ao salvar dados na nuvem:', error);
      // Continua com dados locais - tentará sincronizar depois
    }
  }, [user, userData]);

  const updateSyncPreferences = useCallback(async (prefs: Record<SyncDataType, boolean>) => {
    await updateUserData({ syncPreferences: prefs });
  }, [updateUserData]);

  const syncToCloud = useCallback(async (force = false): Promise<{ success: boolean; message: string }> => {
    if (!user || !userData) {
      return { success: false, message: 'Usuário não autenticado' };
    }

    setIsSyncing(true);
    try {
      // Coleta dados locais para sincronizar baseado nas preferências
      const syncData: any = {
        ...userData,
        lastSyncTimestamp: Date.now(),
      };

      if (userData.syncPreferences.settings) {
        const settings = localStorage.getItem('meteor_settings');
        if (settings) syncData.localSettings = settings;
      }

      if (userData.syncPreferences.chatHistory) {
        const chatHistory = localStorage.getItem('chat_history');
        if (chatHistory) syncData.chatHistory = chatHistory;
      }

      const response = await fetch('/.netlify/functions/saveUserData', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${user.token?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(syncData),
      });

      if (response.ok) {
        localStorage.removeItem('meteor_sync_pending');
        setHasPendingSync(false);
        setLastSyncTime(Date.now());
        setIsSyncing(false);
        return { success: true, message: 'Dados sincronizados com sucesso!' };
      } else {
        throw new Error('Falha na sincronização');
      }
    } catch (error) {
      setIsSyncing(false);
      return { success: false, message: 'Erro ao sincronizar. Tente novamente.' };
    }
  }, [user, userData]);

  const syncFromCloud = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    if (!user) {
      return { success: false, message: 'Usuário não autenticado' };
    }

    setIsSyncing(true);
    try {
      const response = await fetch('/.netlify/functions/getUserData', {
        headers: {
          Authorization: `Bearer ${user.token?.access_token}`,
        },
      });

      if (response.ok) {
        const cloudData = await response.json();
        const mergedData = { 
          ...defaultUserData, 
          ...cloudData,
          syncPreferences: { ...defaultSyncPreferences, ...cloudData.syncPreferences }
        };
        
        setUserData(mergedData);
        localStorage.setItem('meteor_user_data', JSON.stringify(mergedData));
        
        // Restaura dados locais se necessário
        if (cloudData.localSettings && mergedData.syncPreferences?.settings) {
          localStorage.setItem('meteor_settings', cloudData.localSettings);
        }
        if (cloudData.chatHistory && mergedData.syncPreferences?.chatHistory) {
          localStorage.setItem('chat_history', cloudData.chatHistory);
        }
        
        setLastSyncTime(cloudData.lastSyncTimestamp || Date.now());
        setIsSyncing(false);
        return { success: true, message: 'Dados baixados da nuvem com sucesso!' };
      } else {
        throw new Error('Falha ao carregar dados');
      }
    } catch (error) {
      setIsSyncing(false);
      return { success: false, message: 'Erro ao baixar dados. Tente novamente.' };
    }
  }, [user]);

  const refreshUserData = useCallback(async () => {
    if (user) {
      await loadUserData(user);
    }
  }, [user]);

  const deleteAccount = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    try {
      console.log('Deletando dados do usuário:', user.id);
      
      // Deleta dados na nuvem
      const response = await fetch('/.netlify/functions/deleteUserData', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${user.token?.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      console.log('Resultado da exclusão:', result);

      // Limpa TODOS os dados locais
      localStorage.removeItem('meteor_user_data');
      localStorage.removeItem('meteor_sync_pending');
      localStorage.removeItem('meteor_settings');
      localStorage.removeItem('chat_history');
      localStorage.removeItem('meteor_push_city');
      
      // Limpa dados do usuário
      setUserData(null);
      setLastSyncTime(null);
      
      // Faz logout do Netlify Identity
      netlifyIdentity.logout();
      
      return { success: true };
    } catch (error) {
      console.error('Erro ao excluir conta:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro ao excluir conta' 
      };
    }
  }, [user]);

  const login = () => {
    if (identityError) {
      alert('Serviço de autenticação temporariamente indisponível. Tente novamente mais tarde.');
      return;
    }
    netlifyIdentity.open('login');
  };

  const signup = () => {
    if (identityError) {
      alert('Serviço de autenticação temporariamente indisponível. Tente novamente mais tarde.');
      return;
    }
    netlifyIdentity.open('signup');
  };

  const logout = () => {
    netlifyIdentity.logout();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userData,
        isLoggedIn: !!user,
        isLoading,
        isSyncing,
        lastSyncTime,
        identityError,
        login,
        logout,
        signup,
        deleteAccount,
        updateUserData,
        refreshUserData,
        syncToCloud,
        syncFromCloud,
        updateSyncPreferences,
        hasPendingSync,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
