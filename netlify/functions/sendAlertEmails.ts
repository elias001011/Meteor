
import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { getStore } from '@netlify/blobs';

// Esta função pode ser chamada via cron ou manualmente para enviar alertas por email
export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Verifica se é uma chamada autorizada (cron secret ou admin)
  const cronSecret = event.headers['x-cron-secret'];
  const expectedSecret = process.env.CRON_SECRET;
  
  if (cronSecret !== expectedSecret && event.httpMethod !== 'POST') {
    return {
      statusCode: 403,
      body: JSON.stringify({ error: 'Acesso negado' }),
    };
  }

  try {
    const store = getStore('userData');
    
    // Lista de provedores de email que podem ser usados
    // 1. SendGrid - precisa de API key
    // 2. EmailJS - precisa de configuração
    // 3. SMTP direto - menos recomendado
    
    // Por enquanto, apenas loga o que seria enviado
    // Em produção, integrar com SendGrid ou similar
    
    // Exemplo de como seria a implementação com SendGrid:
    /*
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    
    const msg = {
      to: userData.emailAlertAddress,
      from: 'alerts@meteor.app',
      subject: '🌩️ Alerta Meteorológico - Meteor',
      html: `<h2>Alerta de ${alert.title}</h2><p>${alert.message}</p>`,
    };
    
    await sgMail.send(msg);
    */

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        message: 'Sistema de alertas por email configurado (em desenvolvimento)',
        note: 'Integração com SendGrid/EmailJS necessária para envio real'
      }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    };
  } catch (error) {
    console.error('Erro no sistema de alertas:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erro interno' }),
    };
  }
};
