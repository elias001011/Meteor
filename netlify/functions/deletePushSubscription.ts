import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { getStore } from '@netlify/blobs';

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
    const { endpoint } = JSON.parse(event.body || '{}');

    if (!endpoint) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Endpoint não fornecido' }),
      };
    }

    // Tenta usar Netlify Blobs
    try {
      const store = getStore('pushSubscriptions');
      const subscriptionId = endpoint.slice(-32);
      await store.delete(subscriptionId);
    } catch (blobsError: any) {
      if (blobsError.message?.includes('environment has not been configured')) {
        return {
          statusCode: 503,
          headers: corsHeaders,
          body: JSON.stringify({ 
            error: 'Armazenamento não configurado',
            message: 'Netlify Blobs precisa ser habilitado'
          }),
        };
      }
      throw blobsError;
    }

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
