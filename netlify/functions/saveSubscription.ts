import type { Handler } from '@netlify/functions';
import { getStore } from '@netlify/blobs';

const createStore = (name: string) => {
  const siteID = process.env.NETLIFY_BLOBS_SITE_ID;
  const token = process.env.NETLIFY_BLOBS_TOKEN;
  
  if (siteID && token) {
    return getStore({ name, siteID, token });
  }
  
  return getStore(name);
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { subscription, city, enabled } = JSON.parse(event.body || '{}');

    if (!subscription || !subscription.endpoint) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Subscription inválido' }),
      };
    }

    const store = createStore('pushSubscriptions');
    
    // Usa endpoint como ID único
    const id = subscription.endpoint.slice(-32);
    
    await store.setJSON(id, {
      subscription,
      city: city || 'Porto Alegre',
      enabled: enabled !== false,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    });

    console.log(`[Push] Subscription salva: ${id}, cidade: ${city}`);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ success: true, message: 'Subscription salva' }),
    };
  } catch (error: any) {
    console.error('[Push] Erro ao salvar:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Erro interno', details: error.message }),
    };
  }
};
