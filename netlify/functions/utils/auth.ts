
// Utilitário de autenticação para Netlify Functions
// Valida tokens JWT do Netlify Identity

interface DecodedToken {
  sub: string;  // User ID
  email?: string;
  exp?: number;
  iat?: number;
}

/**
 * Decodifica um JWT base64 (sem verificação de assinatura)
 * Usado para extrair o user ID do Netlify Identity
 */
export function decodeJWT(token: string): DecodedToken | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = parts[1];
    // Base64URL para Base64 padrão
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padding = '='.repeat((4 - base64.length % 4) % 4);
    const decoded = Buffer.from(base64 + padding, 'base64').toString('utf-8');
    return JSON.parse(decoded) as DecodedToken;
  } catch (error) {
    console.error('Erro ao decodificar JWT:', error);
    return null;
  }
}

/**
 * Extrai e valida o user ID do header de autorização
 * Retorna null se o token for inválido
 */
export function getUserIdFromToken(authHeader: string): string | null {
  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) return null;
  
  const decoded = decodeJWT(token);
  if (!decoded || !decoded.sub) return null;
  
  // Verifica se o token não expirou
  if (decoded.exp && decoded.exp * 1000 < Date.now()) {
    console.warn('Token expirado');
    return null;
  }
  
  return decoded.sub;
}

/**
 * Headers CORS padrão para todas as funções
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};
