
import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';

interface AlertEmailData {
  to: string;
  alertType: string;
  alertTitle: string;
  alertMessage: string;
  location?: string;
}

// Handler principal
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
  const emailFrom = process.env.EMAIL_FROM || 'onboarding@resend.dev';

  console.log('RESEND_API existe:', !!resendApiKey);
  console.log('EMAIL_FROM:', emailFrom);

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
    console.log('Dados recebidos:', { to: data.to, title: data.alertTitle });

    if (!data.to || !data.alertTitle || !data.alertMessage) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Dados incompletos: email, título e mensagem são obrigatórios' }),
      };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.to)) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Formato de email inválido' }),
      };
    }

    // Envia o email direto
    console.log('Enviando email via Resend...');
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
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a2e; color: #fff; padding: 20px; border-radius: 10px;">
            <h1 style="color: #e94560;">☄️ Meteor</h1>
            <h2>⚠️ ${data.alertTitle}</h2>
            <p>${data.alertMessage}</p>
            ${data.location ? `<p><strong>Local:</strong> ${data.location}</p>` : ''}
          </div>
        `,
        text: `Meteor - ${data.alertTitle}\n\n${data.alertMessage}`,
      }),
    });

    console.log('Status da resposta Resend:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro da API Resend:', errorText);
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
    console.log('Email enviado com sucesso:', result);

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
    console.error('Erro no handler:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Erro interno do servidor',
        details: error.message
      }),
    };
  }
};
