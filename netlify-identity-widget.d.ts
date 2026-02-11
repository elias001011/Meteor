declare module 'netlify-identity-widget' {
  export interface User {
    id: string;
    email: string;
    user_metadata: {
      full_name?: string;
      avatar_url?: string;
    };
    token?: {
      access_token: string;
      token_type: string;
      expires_in: number;
      refresh_token: string;
      expires_at: number;
    };
  }

  export interface InitOptions {
    APIUrl?: string;
    logo?: boolean;
    locale?: string;
  }

  export function init(options?: InitOptions): void;
  export function open(tab?: 'login' | 'signup'): void;
  export function close(): void;
  export function currentUser(): User | null;
  export function logout(): Promise<void>;
  export function on(event: 'login' | 'logout' | 'signup' | 'error' | 'open' | 'close', callback: (user?: User | Error) => void): void;
  export function off(event: 'login' | 'logout' | 'signup' | 'error' | 'open' | 'close', callback?: (user?: User | Error) => void): void;
  
  const netlifyIdentity: {
    init: typeof init;
    open: typeof open;
    close: typeof close;
    currentUser: typeof currentUser;
    logout: typeof logout;
    on: typeof on;
    off: typeof off;
  };

  export default netlifyIdentity;
}
