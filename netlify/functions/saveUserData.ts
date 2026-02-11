
import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { getStore } from '@netlify/blobs';

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Verifica autenticação
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

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Método não permitido' }),
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    };
  }

  try {
    const store = getStore('userData');
    const userId = authHeader.replace('Bearer ', '').slice(0, 32);
    
    const userData = JSON.parse(event.body || '{}');
    
    // Validação básica
    if (typeof userData !== 'object') {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Dados inválidos' }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      };
    }

    // Adiciona timestamp
    userData.lastUpdated = new Date().toISOString();
    
    await store.setJSON(userId, userData);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: 'Dados salvos com sucesso' }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      },
    };
  } catch (error) {
    console.error('Erro ao salvar dados do usuário:', error);
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
