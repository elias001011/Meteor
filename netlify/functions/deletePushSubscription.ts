import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { getStore } from '@netlify/blobs';

// Helper para criar store com credenciais do ambiente
const createStore = (name: string) => {
  const siteID = process.env.NETLIFY_BLOBS_SITE_ID;
  const token = process.env.NETLIFY_BLOBS_TOKEN;
  
  if (siteID && token) {
    return getStore({ name, siteID, token });
  }
  
  return getStore(name);
};

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Método não permitido' }),
    };
  }

  try {
    const store = createStore('pushSubscriptions');
    const { endpoint } = JSON.parse(event.body || '{}');

    if (!endpoint) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Endpoint não fornecido' }),
      };
    }

    const subscriptionId = endpoint.slice(-32);
    await store.delete(subscriptionId);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ success: true, message: 'Inscrição removida' }),
    };
  } catch (error) {
    console.error('Erro ao deletar subscription:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Erro interno' }),
    };
  }
};
