
import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';

interface AlertEmailData {
  to: string;
  alertType: string;
  alertTitle: string;
  alertMessage: string;
  location?: string;
}

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ error: 'Método não permitido' }) };
  }

  const resendApiKey = process.env.RESEND_API;
  
  // Só pode usar onboarding@resend.dev em modo de teste
  const emailFrom = 'onboarding@resend.dev';

  if (!resendApiKey) {
    return {
      statusCode: 503,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Serviço de email não configurado',
        message: 'A variável RESEND_API não está configurada no Netlify'
      }),
    };
  }

  try {
    const data: AlertEmailData = JSON.parse(event.body || '{}');

    if (!data.to || !data.alertTitle || !data.alertMessage) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Dados incompletos' }),
      };
    }

    // Envia o email
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: emailFrom,
        to: data.to,
        subject: `🌩️ ${data.alertTitle} - Alerta Meteorológico`,
        html: `
          <div style="font-family: Arial; max-width: 600px; margin: 0 auto; background: #1a1a2e; color: #fff; padding: 20px; border-radius: 10px;">
            <h1 style="color: #e94560;">☄️ Meteor</h1>
            <h2>⚠️ ${data.alertTitle}</h2>
            <p>${data.alertMessage}</p>
            ${data.location ? `<p><strong>Local:</strong> ${data.location}</p>` : ''}
          </div>
        `,
        text: `Meteor - ${data.alertTitle}\n\n${data.alertMessage}`,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: 'Falha ao enviar email',
          details: errorText,
          status: response.status
        }),
      };
    }

    const result = await response.json();

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ 
        success: true, 
        message: 'Alerta enviado com sucesso',
        id: result.id
      }),
    };

  } catch (error: any) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Erro interno',
        details: error.message
      }),
    };
  }
};
