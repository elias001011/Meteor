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

  const authHeader = event.headers.authorization || event.headers.Authorization;
  if (!authHeader) {
    return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ error: 'Token ausente' }) };
  }

  try {
    const store = getStore('userData');
    // Usa parte do token como ID
    const userId = authHeader.replace('Bearer ', '').slice(0, 32);
    const userData = await store.get(userId, { type: 'json' });

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(userData || {}),
    };
  } catch (error) {
    console.error('Erro:', error);
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Erro interno' }) };
  }
};
