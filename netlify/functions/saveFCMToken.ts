import type { Handler } from '@netlify/functions';

/**
 * Netlify Function para salvar FCM Token
 * Usado quando o app está rodando no TWA/APK Android
 * com Firebase Cloud Messaging
 */

export const handler: Handler = async (event) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { token, platform, source } = JSON.parse(event.body || '{}');

    if (!token) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Token is required' })
      };
    }

    // Aqui você salvaria o token no seu banco de dados
    // Ex: MongoDB, FaunaDB, Supabase, etc.
    
    // Exemplo com Netlify Blobs:
    // const { getStore } = require('@netlify/blobs');
    // const store = getStore('fcm_tokens');
    // await store.set(token, JSON.stringify({ 
    //   token, 
    //   platform, 
    //   source,
    //   createdAt: Date.now() 
    // }));

    console.log('FCM Token salvo:', { token: token.substring(0, 20) + '...', platform, source });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true,
        message: 'Token saved successfully'
      })
    };
  } catch (error: any) {
    console.error('Error saving FCM token:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to save token',
        details: error.message 
      })
    };
  }
};
