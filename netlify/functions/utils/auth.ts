
// Utilitário de autenticação para Netlify Functions
// Valida tokens JWT do Netlify Identity

interface DecodedToken {
  sub: string;
  email?: string;
  exp?: number;
}

// Decodifica JWT sem usar Buffer (compatível com Netlify)
function decodeJWT(token: string): DecodedToken | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = parts[1];
    // Base64URL decode usando atob (browser/edge compatible)
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(base64);
    return JSON.parse(decoded) as DecodedToken;
  } catch (error) {
    console.error('Erro ao decodificar JWT:', error);
    return null;
  }
}

export function getUserIdFromToken(authHeader: string): string | null {
  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) return null;
  
  const decoded = decodeJWT(token);
  if (!decoded || !decoded.sub) return null;
  
  if (decoded.exp && decoded.exp * 1000 < Date.now()) {
    console.warn('Token expirado');
    return null;
  }
  
  return decoded.sub;
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};
