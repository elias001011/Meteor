import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { getStore } from '@netlify/blobs';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
};

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ error: 'Método não permitido' }) };
  }

  const authHeader = event.headers.authorization || event.headers.Authorization;
  if (!authHeader) {
    return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ error: 'Token ausente' }) };
  }

  try {
    const store = getStore('userData');
    const userId = authHeader.replace('Bearer ', '').slice(0, 32);
    await store.delete(userId);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ success: true, message: 'Dados excluídos' }),
    };
  } catch (error) {
    console.error('Erro:', error);
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Erro interno' }) };
  }
};
