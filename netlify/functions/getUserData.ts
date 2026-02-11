
import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { getStore } from '@netlify/blobs';
import { getUserIdFromToken, corsHeaders } from './utils/auth';

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Responde a preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  // Verifica autenticação via header
  const authHeader = event.headers.authorization || event.headers.Authorization;
  if (!authHeader) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Não autorizado - token ausente' }),
      headers: corsHeaders,
    };
  }

  // Extrai e valida o user ID do token JWT
  const userId = getUserIdFromToken(authHeader);
  if (!userId) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Não autorizado - token inválido ou expirado' }),
      headers: corsHeaders,
    };
  }

  try {
    const store = getStore('userData');
    const userData = await store.get(userId, { type: 'json' });

    return {
      statusCode: 200,
      body: JSON.stringify(userData || {}),
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    };
  } catch (error) {
    console.error('Erro ao buscar dados do usuário:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erro interno do servidor' }),
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    };
  }
};
