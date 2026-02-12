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

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: ADMIN_EMAIL,
        subject: '🔴 Solicitação de Exclusão de Dados - Meteor App',
        html: `
          <h2>Solicitação de Exclusão de Dados</h2>
          <p><strong>Email do usuário:</strong> ${email}</p>
          <p><strong>User ID:</strong> ${userId || 'N/A'}</p>
          <p><strong>Data da solicitação:</strong> ${new Date().toLocaleString('pt-BR')}</p>
          ${reason ? `<p><strong>Motivo:</strong> ${reason}</p>` : ''}
          <hr>
          <p>Ação necessária: Excluir dados do usuário do Netlify Blobs.</p>
        `,
        text: `Solicitação de Exclusão de Dados\n\nEmail: ${email}\nUser ID: ${userId || 'N/A'}\nData: ${new Date().toLocaleString('pt-BR')}\n${reason ? `Motivo: ${reason}\n` : ''}`,
      }),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      console.error('Erro Resend:', resendResponse.status, errorText);
      return {
        statusCode: 500,
        headers: cors,
        body: JSON.stringify({ error: 'Erro ao enviar notificação', details: errorText }),
      };
    }

    return {
      statusCode: 200,
      headers: cors,
      body: JSON.stringify({ 
        success: true, 
        message: 'Solicitação registrada com sucesso.' 
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
