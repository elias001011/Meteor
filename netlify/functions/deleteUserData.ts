import type { Handler } from '@netlify/functions';
import { getStore } from '@netlify/blobs';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
};

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: cors, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: cors, body: JSON.stringify({ error: 'POST only' }) };
  }

  const auth = event.headers.authorization || '';
  const userId = auth.replace('Bearer ', '').slice(0, 32) || 'anonymous';

  try {
    // Deleta dados do usuário no blob store
    const store = getStore('userData');
    await store.delete(userId);
    
    // Deleta subscription de push
    const pushStore = getStore('pushSubscriptions');
    await pushStore.delete(userId);

    return {
      statusCode: 200,
      headers: cors,
      body: JSON.stringify({ success: true, message: 'Dados excluídos' }),
    };
  } catch (err) {
    console.error('Erro ao deletar:', err);
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: String(err) }) };
  }
};
