import { createHash } from 'node:crypto';
import type { Handler, HandlerEvent, HandlerResponse } from '@netlify/functions';
import {
  authenticateMobileRequest,
  getMobileFirebaseServices,
  MobileAuthenticationError,
  MobileFirebaseConfigurationError,
} from './mobile-firebase';
import { MobilePayloadError, parseDeleteInstallation } from './mobile-push-contract';
import {
  buildRateLimitResponse,
  checkRateLimit,
  errorResponse,
  jsonResponse,
  safeErrorName,
} from './security';

const ALLOWED_METHODS = ['POST', 'OPTIONS'];
const MAX_BODY_LENGTH = 2_000;
const COLLECTION = 'mobilePushInstallations';
const RESPONSE_HEADERS = {
  'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization, X-Firebase-AppCheck',
};

const options = (headers: Record<string, string> = {}) => ({
  methods: ALLOWED_METHODS,
  headers: { ...RESPONSE_HEADERS, ...headers },
});

const response = (event: HandlerEvent, statusCode: number, payload: unknown): HandlerResponse => (
  jsonResponse(event, statusCode, payload, options())
);

const documentId = (uid: string, installationId: string): string => (
  createHash('sha256').update(`${uid}\u0000${installationId}`).digest('hex')
);

const parseBody = (event: HandlerEvent): string => {
  if (!event.body) throw new MobilePayloadError('body');
  try {
    return parseDeleteInstallation(JSON.parse(event.body) as unknown);
  } catch (error) {
    if (error instanceof MobilePayloadError) throw error;
    throw new MobilePayloadError('body');
  }
};

const authenticationResponse = (
  event: HandlerEvent,
  error: MobileAuthenticationError,
): HandlerResponse => {
  const appCheckError = error.code === 'APP_CHECK_REQUIRED' || error.code === 'INVALID_APP_CHECK';
  return errorResponse(
    event,
    appCheckError ? 403 : 401,
    error.code,
    appCheckError
      ? 'Não foi possível validar a integridade do aplicativo.'
      : 'Autenticação do aplicativo necessária.',
    options(appCheckError ? {} : { 'WWW-Authenticate': 'Bearer' }),
  );
};

const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return response(event, 204, null);
  if (event.httpMethod !== 'POST') {
    return errorResponse(event, 405, 'METHOD_NOT_ALLOWED', 'Método não permitido.', options({
      Allow: ALLOWED_METHODS.join(', '),
    }));
  }
  if ((event.body || '').length > MAX_BODY_LENGTH) {
    return errorResponse(event, 413, 'REQUEST_TOO_LARGE', 'Corpo da requisição muito grande.', options());
  }

  const rateLimit = await checkRateLimit(event, {
    namespace: 'mobile-push-test',
    limit: 8,
    windowSeconds: 600,
  });
  if (!rateLimit.allowed) {
    const limited = buildRateLimitResponse(event, rateLimit, ALLOWED_METHODS);
    return { ...limited, headers: { ...limited.headers, ...RESPONSE_HEADERS } };
  }

  try {
    const services = getMobileFirebaseServices();
    const decoded = await authenticateMobileRequest(event.headers);
    if (decoded.firebase?.sign_in_provider !== 'anonymous') {
      return errorResponse(
        event,
        403,
        'ANONYMOUS_AUTH_REQUIRED',
        'Use a sessão anônima do aplicativo.',
        options(),
      );
    }

    const installationId = parseBody(event);
    const snapshot = await services.firestore
      .collection(COLLECTION)
      .doc(documentId(decoded.uid, installationId))
      .get();
    const installation = snapshot.data();
    if (
      !snapshot.exists
      || installation?.uid !== decoded.uid
      || installation?.installationId !== installationId
      || installation?.enabled !== true
      || typeof installation?.fcmToken !== 'string'
    ) {
      return errorResponse(
        event,
        404,
        'INSTALLATION_NOT_FOUND',
        'Ative e sincronize as notificações antes de testar.',
        options(),
      );
    }

    await services.messaging.send({
      token: installation.fcmToken,
      notification: {
        title: 'Meteor está pronto',
        body: 'As notificações deste aparelho estão funcionando.',
      },
      data: { type: 'test', route: 'today' },
      android: {
        priority: 'high',
        ttl: 5 * 60 * 1_000,
        collapseKey: 'meteor-test',
        notification: {
          channelId: 'meteor_general',
          tag: 'meteor-test',
          sound: 'default',
          priority: 'high',
        },
      },
    });
    return response(event, 202, { ok: true });
  } catch (error) {
    if (error instanceof MobileFirebaseConfigurationError) {
      return errorResponse(
        event,
        503,
        'PUSH_NOT_CONFIGURED',
        'O serviço de notificações ainda não está configurado.',
        options({ 'Retry-After': '300' }),
      );
    }
    if (error instanceof MobileAuthenticationError) {
      return authenticationResponse(event, error);
    }
    if (error instanceof MobilePayloadError) {
      return errorResponse(
        event,
        400,
        'INVALID_PUSH_PAYLOAD',
        'Dados de instalação inválidos.',
        options(),
      );
    }
    console.warn(`[MobilePush] Test delivery failed (${safeErrorName(error)}).`);
    return errorResponse(
      event,
      503,
      'PUSH_TEST_FAILED',
      'O Firebase não confirmou a notificação de teste.',
      options({ 'Retry-After': '15' }),
    );
  }
};

export { handler };
