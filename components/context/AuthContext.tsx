
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import netlifyIdentity, { User } from 'netlify-identity-widget';

interface UserData {
  emailAlertsEnabled: boolean;
  emailAlertAddress: string;
  favoriteCities: string[];
  aiChatHistory: { role: 'user' | 'model'; text: string; timestamp: number }[];
  aiConversationsToday: number;
  lastConversationDate: string;
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
  identityError: string | null;
  login: () => void;
  logout: () => void;
  signup: () => void;
  updateUserData: (data: Partial<UserData>) => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const defaultUserData: UserData = {
  emailAlertsEnabled: false,
  emailAlertAddress: '',
  favoriteCities: [],
  aiChatHistory: [],
  aiConversationsToday: 0,
  lastConversationDate: new Date().toISOString().split('T')[0],
  settings: {
    transparencyMode: 'glass',
    reduceMotion: false,
    highContrast: false,
    dataSource: 'default',
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// URL do site Netlify - usa a origem atual
const NETLIFY_SITE_URL = window.location.origin;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [identityError, setIdentityError] = useState<string | null>(null);

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
      // Limpa localStorage ao fazer logout
      localStorage.removeItem('meteor_user_data');
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
        setUserData({ ...defaultUserData, ...cloudData });
        // Salva backup local
        localStorage.setItem('meteor_user_data', JSON.stringify(cloudData));
      } else {
        // Fallback para localStorage
        const localData = localStorage.getItem('meteor_user_data');
        if (localData) {
          setUserData({ ...defaultUserData, ...JSON.parse(localData) });
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

    // Tenta salvar na nuvem
    try {
      await fetch('/.netlify/functions/saveUserData', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${user.token?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newData),
      });
    } catch (error) {
      console.error('Erro ao salvar dados na nuvem:', error);
      // Continua com dados locais - tentará sincronizar depois
    }
  }, [user, userData]);

  const refreshUserData = useCallback(async () => {
    if (user) {
      await loadUserData(user);
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
        identityError,
        login,
        logout,
        signup,
        updateUserData,
        refreshUserData,
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
