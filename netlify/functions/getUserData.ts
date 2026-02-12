import type { Handler } from '@netlify/functions';
import { getStore } from '@netlify/blobs';

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
    
    const store = getStore('userData');
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
