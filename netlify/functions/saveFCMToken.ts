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
    const { token, city, enabled } = JSON.parse(event.body || '{}');

    if (!token) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Token é obrigatório' }),
      };
    }

    const store = createStore('fcmTokens');
    
    // Usa os últimos 32 chars do token como ID
    const id = token.slice(-32);
    
    await store.setJSON(id, {
      token,
      city: city || 'Porto Alegre',
      enabled: enabled !== false,
      type: 'fcm',
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    });

    console.log(`[FCM] Token salvo: ${id}, cidade: ${city}`);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ success: true, type: 'fcm' }),
    };
  } catch (error: any) {
    console.error('[FCM] Erro ao salvar:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Erro interno' }),
    };
  }
};
