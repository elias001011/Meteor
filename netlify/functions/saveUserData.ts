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

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: cors, body: JSON.stringify({ error: 'POST only' }) };
  }

  try {
    const auth = event.headers.authorization || '';
    const userId = auth.replace('Bearer ', '').slice(0, 32) || 'anonymous';
    
    const data = JSON.parse(event.body || '{}');
    data.lastUpdated = Date.now();
    
    // Tenta usar Netlify Blobs
    try {
      const store = getStore('userData');
      await store.setJSON(userId, data);
      return {
        statusCode: 200,
        headers: cors,
        body: JSON.stringify({ success: true }),
      };
    } catch (blobsError: any) {
      // Se Blobs não estiver configurado, retorna erro informativo
      if (blobsError.message?.includes('environment has not been configured')) {
        return {
          statusCode: 503,
          headers: cors,
          body: JSON.stringify({ 
            error: 'Armazenamento em nuvem não configurado',
            message: 'O Netlify Blobs precisa ser habilitado para este site'
          }),
        };
      }
      throw blobsError;
    }
  } catch (err) {
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: String(err) }) };
  }
};
