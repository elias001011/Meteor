
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

  // Apenas aceita POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Método não permitido' }),
      headers: corsHeaders,
    };
  }

  // Verifica autenticação
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
    
    // Deleta os dados do usuário
    await store.delete(userId);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: 'Dados excluídos com sucesso' }),
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    };
  } catch (error) {
    console.error('Erro ao deletar dados do usuário:', error);
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
