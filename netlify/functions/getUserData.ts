import type { Handler } from '@netlify/functions';
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

export const handler: Handler = async (event) => {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: cors, body: '' };
  }

  try {
    const auth = event.headers.authorization || '';
    const userId = auth.replace('Bearer ', '').slice(0, 32) || 'anonymous';
    
    const store = createStore('userData');
    const data = await store.get(userId, { type: 'json' });

    return {
      statusCode: 200,
      headers: cors,
      body: JSON.stringify(data || {}),
    };
  } catch (err) {
    return { statusCode: 200, headers: cors, body: JSON.stringify({}) };
  }
};
