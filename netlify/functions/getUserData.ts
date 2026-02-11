
import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { getStore } from '@netlify/blobs';

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Verifica autenticação via header
  const authHeader = event.headers.authorization || event.headers.Authorization;
  if (!authHeader) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Não autorizado - token ausente' }),
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      },
    };
  }

  try {
    // Extrai user ID do token (simplificado - em produção verificar JWT corretamente)
    const store = getStore('userData');
    const userId = authHeader.replace('Bearer ', '').slice(0, 32); // Usa parte do token como ID temporário
    
    const userData = await store.get(userId, { type: 'json' });

    return {
      statusCode: 200,
      body: JSON.stringify(userData || {}),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      },
    };
  } catch (error) {
    console.error('Erro ao buscar dados do usuário:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erro interno do servidor' }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    };
  }
};
