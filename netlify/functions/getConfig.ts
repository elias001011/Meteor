import type { Handler } from '@netlify/functions';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  // Retorna apenas configurações públicas (seguro)
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({
      VAPID_PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY || ''
    }),
  };
};
