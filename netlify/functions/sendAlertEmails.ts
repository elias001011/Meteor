
import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { getStore } from '@netlify/blobs';

interface AlertEmailData {
  to: string;
  alertType: string;
  alertTitle: string;
  alertMessage: string;
  location?: string;
}

// Função para enviar email usando Resend
const sendEmailWithResend = async (apiKey: string, from: string, data: AlertEmailData): Promise<boolean> => {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: from,
        to: data.to,
        subject: `🌩️ ${data.alertTitle} - Alerta Meteorológico`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a2e; color: #fff; padding: 20px; border-radius: 10px;">
            <div style="text-align: center; padding: 20px; border-bottom: 2px solid #e94560;">
              <h1 style="color: #e94560; margin: 0;">☄️ Meteor</h1>
              <p style="color: #888; margin: 10px 0 0 0;">Alerta Meteorológico</p>
            </div>
            
            <div style="padding: 30px 20px;">
              <div style="background: #e94560; color: white; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <h2 style="margin: 0; font-size: 18px;">⚠️ ${data.alertTitle}</h2>
              </div>
              
              <p style="font-size: 16px; line-height: 1.6; color: #ddd;">
                ${data.alertMessage}
              </p>
              
              ${data.location ? `
              <div style="background: #16213e; padding: 15px; border-radius: 8px; margin-top: 20px;">
                <p style="margin: 0; color: #888;"><strong>Local:</strong> ${data.location}</p>
              </div>
              ` : ''}
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #333; text-align: center;">
                <p style="color: #666; font-size: 12px; margin: 0;">
                  Este é um alerta automático do Meteor. Para alterar suas preferências, acesse o app.
                </p>
              </div>
            </div>
          </div>
        `,
        text: `Meteor - Alerta Meteorológico

⚠️ ${data.alertTitle}

${data.alertMessage}

${data.location ? `Local: ${data.location}` : ''}

---
Este é um alerta automático do Meteor.`,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Erro ao enviar email:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    return false;
  }
};

// Handler principal
export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Configurações CORS
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Responde a preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  // Apenas aceita POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Método não permitido' }),
    };
  }

  const resendApiKey = process.env.RESEND_API;
  const emailFrom = process.env.EMAIL_FROM || 'alerts@meteor.app';

  if (!resendApiKey) {
    return {
      statusCode: 503,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Serviço de email não configurado',
        message: 'A API key do Resend não está configurada'
      }),
    };
  }

  try {
    const data: AlertEmailData = JSON.parse(event.body || '{}');

    // Validação
    if (!data.to || !data.alertTitle || !data.alertMessage) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Dados incompletos' }),
      };
    }

    // Valida email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.to)) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Email inválido' }),
      };
    }

    // Envia o email
    const success = await sendEmailWithResend(resendApiKey, emailFrom, data);

    if (success) {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ 
          success: true, 
          message: 'Alerta enviado com sucesso'
        }),
      };
    } else {
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Falha ao enviar email' }),
      };
    }

  } catch (error) {
    console.error('Erro no handler:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
};
