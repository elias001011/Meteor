import { createHash } from 'node:crypto';
import type { Handler, HandlerEvent, HandlerResponse } from '@netlify/functions';
import { Timestamp } from 'firebase-admin/firestore';
import {
  authenticateMobileRequest,
  getMobileFirebaseServices,
  MobileAuthenticationError,
  MobileFirebaseConfigurationError,
} from './mobile-firebase';
import {
  mergePreferences,
  MobilePayloadError,
  parseCreateInstallation,
  parseDeleteInstallation,
  parsePatchInstallation,
  type MobileInstallationInput,
  type MobileInstallationPatch,
  type StoredMobileInstallation,
} from './mobile-push-contract';
import {
  buildRateLimitResponse,
  checkRateLimit,
  errorResponse,
  jsonResponse,
  safeErrorName,
} from './security';

const ALLOWED_METHODS = ['POST', 'PATCH', 'DELETE', 'OPTIONS'];
const MAX_BODY_LENGTH = 16_000;
const COLLECTION = 'mobilePushInstallations';
const TOKEN_OWNER_COLLECTION = 'mobilePushTokenOwners';
const INSTALLATION_RETENTION_MS = 90 * 24 * 60 * 60 * 1_000;
const RESPONSE_HEADERS = {
  'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization, X-Firebase-AppCheck',
};

class MobileInstallationConflictError extends Error {
  constructor() {
    super('FCM target already belongs to another installation');
    this.name = 'MobileInstallationConflictError';
  }
}

const hash = (value: string): string => createHash('sha256').update(value).digest('hex');
const installationDocumentId = (uid: string, installationId: string): string => hash(`${uid}\u0000${installationId}`);

const options = (headers: Record<string, string> = {}) => ({
  methods: ALLOWED_METHODS,
  headers: { ...RESPONSE_HEADERS, ...headers },
});

const response = (event: HandlerEvent, statusCode: number, payload: unknown): HandlerResponse => (
  jsonResponse(event, statusCode, payload, options())
);

const parseJsonBody = (event: HandlerEvent): unknown => {
  if (!event.body) throw new MobilePayloadError('body');
  try {
    return JSON.parse(event.body) as unknown;
  } catch {
    throw new MobilePayloadError('body');
  }
};

const ownerPath = (value: unknown): string => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return '';
  const path = (value as Record<string, unknown>).installationPath;
  return typeof path === 'string' ? path : '';
};

const publicInstallation = (installation: StoredMobileInstallation) => ({
  installationId: installation.installationId,
  location: installation.location,
  timeZone: installation.timeZone,
  preferences: installation.preferences,
  locale: installation.locale,
  appVersion: installation.appVersion,
  platform: installation.platform,
  enabled: installation.enabled,
});

const saveInstallation = async (
  uid: string,
  input: MobileInstallationInput | MobileInstallationPatch,
  create: boolean
): Promise<StoredMobileInstallation | null> => {
  const { firestore } = getMobileFirebaseServices();
  const installationRef = firestore.collection(COLLECTION).doc(installationDocumentId(uid, input.installationId));

  return firestore.runTransaction(async (transaction) => {
    const existingSnapshot = await transaction.get(installationRef);
    if (!create && !existingSnapshot.exists) return null;
    const existing = existingSnapshot.data() as StoredMobileInstallation | undefined;
    if (existing && (existing.uid !== uid || existing.installationId !== input.installationId)) {
      throw new MobileInstallationConflictError();
    }

    const nextToken = 'fcmToken' in input && input.fcmToken ? input.fcmToken : existing?.fcmToken;
    if (!nextToken) throw new MobilePayloadError('fcmToken');
    const nextTokenHash = hash(nextToken);
    const newOwnerRef = firestore.collection(TOKEN_OWNER_COLLECTION).doc(nextTokenHash);
    const oldOwnerRef = existing?.tokenHash && existing.tokenHash !== nextTokenHash
      ? firestore.collection(TOKEN_OWNER_COLLECTION).doc(existing.tokenHash)
      : null;
    const [newOwnerSnapshot, oldOwnerSnapshot] = await Promise.all([
      transaction.get(newOwnerRef),
      oldOwnerRef ? transaction.get(oldOwnerRef) : Promise.resolve(null),
    ]);

    if (newOwnerSnapshot.exists && ownerPath(newOwnerSnapshot.data()) !== installationRef.path) {
      throw new MobileInstallationConflictError();
    }

    const now = Timestamp.now();
    let stored: StoredMobileInstallation;
    if (create) {
      const creation = input as MobileInstallationInput;
      stored = {
        schemaVersion: 1,
        uid,
        installationId: creation.installationId,
        fcmToken: creation.fcmToken,
        tokenHash: nextTokenHash,
        location: creation.location,
        timeZone: creation.timeZone,
        preferences: creation.preferences,
        locale: creation.locale,
        appVersion: creation.appVersion,
        platform: 'android',
        enabled: true,
        createdAt: existing?.createdAt || now,
        updatedAt: now,
        lastSeenAt: now,
        expiresAt: Timestamp.fromMillis(now.toMillis() + INSTALLATION_RETENTION_MS),
      };
    } else {
      const patch = input as MobileInstallationPatch;
      if (!existing) return null;
      stored = {
        ...existing,
        fcmToken: nextToken,
        tokenHash: nextTokenHash,
        location: patch.location || existing.location,
        timeZone: patch.timeZone || existing.timeZone,
        preferences: patch.preferences
          ? mergePreferences(existing.preferences, patch.preferences)
          : existing.preferences,
        locale: patch.locale || existing.locale,
        appVersion: patch.appVersion || existing.appVersion,
        enabled: true,
        updatedAt: now,
        lastSeenAt: now,
        expiresAt: Timestamp.fromMillis(now.toMillis() + INSTALLATION_RETENTION_MS),
      };
    }

    transaction.set(installationRef, stored);
    transaction.set(newOwnerRef, {
      installationPath: installationRef.path,
      uid,
      updatedAt: now,
    });
    if (oldOwnerRef && oldOwnerSnapshot?.exists && ownerPath(oldOwnerSnapshot.data()) === installationRef.path) {
      transaction.delete(oldOwnerRef);
    }
    return stored;
  });
};

const deleteInstallation = async (uid: string, installationId: string): Promise<void> => {
  const { firestore } = getMobileFirebaseServices();
  const installationRef = firestore.collection(COLLECTION).doc(installationDocumentId(uid, installationId));
  await firestore.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(installationRef);
    if (!snapshot.exists) return;
    const installation = snapshot.data() as StoredMobileInstallation;
    if (installation.uid !== uid || installation.installationId !== installationId) return;
    const ownerRef = typeof installation.tokenHash === 'string'
      ? firestore.collection(TOKEN_OWNER_COLLECTION).doc(installation.tokenHash)
      : null;
    const ownerSnapshot = ownerRef ? await transaction.get(ownerRef) : null;
    transaction.delete(installationRef);
    if (ownerRef && ownerSnapshot?.exists && ownerPath(ownerSnapshot.data()) === installationRef.path) {
      transaction.delete(ownerRef);
    }
  });
};

const authenticationResponse = (event: HandlerEvent, error: MobileAuthenticationError): HandlerResponse => {
  const appCheckError = error.code === 'APP_CHECK_REQUIRED' || error.code === 'INVALID_APP_CHECK';
  return errorResponse(
    event,
    appCheckError ? 403 : 401,
    error.code,
    appCheckError ? 'Não foi possível validar a integridade do aplicativo.' : 'Autenticação do aplicativo necessária.',
    options(appCheckError ? {} : { 'WWW-Authenticate': 'Bearer' })
  );
};

const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod === 'OPTIONS') return response(event, 204, null);
  if (!ALLOWED_METHODS.includes(event.httpMethod)) {
    return errorResponse(event, 405, 'METHOD_NOT_ALLOWED', 'Método não permitido.', options({
      Allow: ALLOWED_METHODS.join(', '),
    }));
  }
  if ((event.body || '').length > MAX_BODY_LENGTH) {
    return errorResponse(event, 413, 'REQUEST_TOO_LARGE', 'Corpo da requisição muito grande.', options());
  }

  const rateLimit = await checkRateLimit(event, {
    namespace: 'mobile-installation',
    limit: 40,
    windowSeconds: 600,
  });
  if (!rateLimit.allowed) {
    const limited = buildRateLimitResponse(event, rateLimit, ALLOWED_METHODS);
    return { ...limited, headers: { ...limited.headers, ...RESPONSE_HEADERS } };
  }

  try {
    // Configuration is intentionally checked before auth. An unconfigured
    // deploy never attempts token validation or writes partial state.
    getMobileFirebaseServices();
    const decoded = await authenticateMobileRequest(event.headers);
    if (decoded.firebase?.sign_in_provider !== 'anonymous') {
      return errorResponse(event, 403, 'ANONYMOUS_AUTH_REQUIRED', 'Use a sessão anônima do aplicativo.', options());
    }

    const body = parseJsonBody(event);
    if (event.httpMethod === 'POST') {
      const stored = await saveInstallation(decoded.uid, parseCreateInstallation(body), true);
      return response(event, 201, { installation: publicInstallation(stored!) });
    }
    if (event.httpMethod === 'PATCH') {
      const stored = await saveInstallation(decoded.uid, parsePatchInstallation(body), false);
      if (!stored) return errorResponse(event, 404, 'INSTALLATION_NOT_FOUND', 'Instalação não encontrada.', options());
      return response(event, 200, { installation: publicInstallation(stored) });
    }

    await deleteInstallation(decoded.uid, parseDeleteInstallation(body));
    return response(event, 204, null);
  } catch (error) {
    if (error instanceof MobileFirebaseConfigurationError) {
      return errorResponse(event, 503, 'PUSH_NOT_CONFIGURED', 'O serviço de notificações ainda não está configurado.', options({
        'Retry-After': '300',
      }));
    }
    if (error instanceof MobileAuthenticationError) return authenticationResponse(event, error);
    if (error instanceof MobilePayloadError) {
      return errorResponse(event, 400, 'INVALID_PUSH_PAYLOAD', 'Dados de instalação ou preferências inválidos.', options());
    }
    if (error instanceof MobileInstallationConflictError) {
      return errorResponse(event, 409, 'PUSH_TARGET_CONFLICT', 'Este destino de notificação já pertence a outra instalação.', options());
    }

    console.error(`[MobilePush] Installation operation failed (${safeErrorName(error)}).`);
    return errorResponse(event, 503, 'PUSH_STORAGE_UNAVAILABLE', 'Não foi possível salvar as preferências agora.', options({
      'Retry-After': '15',
    }));
  }
};

export { handler };
