import type { Handler } from '@netlify/functions';

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

  const RESEND_API = process.env.RESEND_API;
  const EMAIL_FROM = process.env.EMAIL_FROM || 'onboarding@resend.dev';
  const ADMIN_EMAIL = 'elias.juriatti@outlook.com';

  if (!RESEND_API) {
    return {
      statusCode: 503,
      headers: cors,
      body: JSON.stringify({ error: 'Serviço de email não configurado' }),
    };
  }

  try {
    const { email, userId, reason } = JSON.parse(event.body || '{}');

    if (!email) {
      return {
        statusCode: 400,
        headers: cors,
        body: JSON.stringify({ error: 'Email é obrigatório' }),
      };
    }

    const emailBody = {
      from: EMAIL_FROM,
      to: ADMIN_EMAIL,
      subject: '🔴 Solicitação de Exclusão de Dados - Meteor App',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
          <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #dc2626; margin-top: 0;">🗑️ Solicitação de Exclusão de Dados</h2>
            
            <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Email do usuário:</strong> ${email}</p>
              <p style="margin: 5px 0;"><strong>User ID:</strong> ${userId || 'N/A'}</p>
              <p style="margin: 5px 0;"><strong>Data da solicitação:</strong> ${new Date().toLocaleString('pt-BR')}</p>
            </div>
            
            ${reason ? `
            <div style="background: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Motivo informado:</strong></p>
              <p style="margin: 10px 0 0 0; font-style: italic; color: #4b5563;">${reason}</p>
            </div>
            ` : ''}
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            
            <p style="color: #6b7280; font-size: 14px;">
              <strong>Ação necessária:</strong> Excluir dados do usuário do Netlify Blobs.
            </p>
            
            <div style="margin-top: 20px; padding: 10px; background: #eff6ff; border-radius: 5px; font-size: 12px; color: #1e40af;">
              ID do usuário no Netlify Blobs: <code>${userId || 'N/A'}</code>
            </div>
          </div>
        </div>
      `,
      text: `Solicitação de Exclusão de Dados - Meteor App

Email do usuário: ${email}
User ID: ${userId || 'N/A'}
Data da solicitação: ${new Date().toLocaleString('pt-BR')}
${reason ? `Motivo: ${reason}` : 'Motivo: Não informado'}

Ação necessária: Excluir dados do usuário do Netlify Blobs.`,
    };

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailBody),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      console.error('Erro Resend:', resendResponse.status, errorText);
      return {
        statusCode: 500,
        headers: cors,
        body: JSON.stringify({ 
          error: 'Erro ao enviar email', 
          details: errorText,
          status: resendResponse.status 
        }),
      };
    }

    const result = await resendResponse.json();

    return {
      statusCode: 200,
      headers: cors,
      body: JSON.stringify({ 
        success: true, 
        message: 'Solicitação registrada com sucesso.',
        emailId: result.id 
      }),
    };
  } catch (err: any) {
    console.error('Erro:', err);
    return {
      statusCode: 500,
      headers: cors,
      body: JSON.stringify({ error: err.message || 'Erro interno' }),
    };
  }
};
