import { cert, getApps, initializeApp, type App, type ServiceAccount } from 'firebase-admin/app';
import { getAppCheck, type AppCheck } from 'firebase-admin/app-check';
import { getAuth, type Auth, type DecodedIdToken } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getMessaging, type Messaging } from 'firebase-admin/messaging';

const MOBILE_FIREBASE_APP_NAME = 'meteor-mobile-push';
const MAX_SERVICE_ACCOUNT_LENGTH = 24_000;

interface FirebaseAdminServices {
  app: App;
  auth: Auth;
  appCheck: AppCheck;
  firestore: Firestore;
  messaging: Messaging;
  projectId: string;
}

interface ServiceAccountJson {
  type?: unknown;
  project_id?: unknown;
  private_key?: unknown;
  client_email?: unknown;
}

export class MobileFirebaseConfigurationError extends Error {
  constructor() {
    super('Firebase Admin is not configured');
    this.name = 'MobileFirebaseConfigurationError';
  }
}

export class MobileAuthenticationError extends Error {
  constructor(public readonly code: 'AUTH_REQUIRED' | 'INVALID_AUTH' | 'APP_CHECK_REQUIRED' | 'INVALID_APP_CHECK') {
    super(code);
    this.name = 'MobileAuthenticationError';
  }
}

const parseServiceAccount = (): { account: ServiceAccount; projectId: string } => {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim() || '';
  if (!raw || raw.length > MAX_SERVICE_ACCOUNT_LENGTH) throw new MobileFirebaseConfigurationError();

  let value: ServiceAccountJson;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      throw new Error('not an object');
    }
    value = parsed as ServiceAccountJson;
  } catch {
    throw new MobileFirebaseConfigurationError();
  }

  const projectId = typeof value.project_id === 'string' ? value.project_id.trim() : '';
  const clientEmail = typeof value.client_email === 'string' ? value.client_email.trim() : '';
  const privateKey = typeof value.private_key === 'string' ? value.private_key.trim() : '';
  if (
    value.type !== 'service_account'
    || !/^[a-z][a-z0-9-]{4,62}$/.test(projectId)
    || !/^[^\s@]+@[^\s@]+\.iam\.gserviceaccount\.com$/.test(clientEmail)
    || !privateKey.startsWith('-----BEGIN PRIVATE KEY-----')
    || !privateKey.endsWith('-----END PRIVATE KEY-----')
  ) {
    throw new MobileFirebaseConfigurationError();
  }

  return {
    projectId,
    account: { projectId, clientEmail, privateKey },
  };
};

let cachedServices: FirebaseAdminServices | undefined;

export const getMobileFirebaseServices = (): FirebaseAdminServices => {
  if (cachedServices) return cachedServices;
  const { account, projectId } = parseServiceAccount();
  const existing = getApps().find((app) => app.name === MOBILE_FIREBASE_APP_NAME);
  const app = existing || initializeApp({ credential: cert(account), projectId }, MOBILE_FIREBASE_APP_NAME);
  cachedServices = {
    app,
    projectId,
    auth: getAuth(app),
    appCheck: getAppCheck(app),
    firestore: getFirestore(app),
    messaging: getMessaging(app),
  };
  return cachedServices;
};

const header = (headers: Record<string, string | undefined>, name: string): string => {
  const lower = name.toLowerCase();
  return (headers[lower] || headers[name] || '').trim();
};

export const authenticateMobileRequest = async (
  headers: Record<string, string | undefined>
): Promise<DecodedIdToken> => {
  const services = getMobileFirebaseServices();
  const authorization = header(headers, 'authorization');
  const match = /^Bearer ([A-Za-z0-9._~-]+)$/.exec(authorization);
  if (!match) throw new MobileAuthenticationError('AUTH_REQUIRED');

  const appCheckToken = header(headers, 'x-firebase-appcheck');
  if (!appCheckToken) throw new MobileAuthenticationError('APP_CHECK_REQUIRED');

  let decoded: DecodedIdToken;
  try {
    decoded = await services.auth.verifyIdToken(match[1], true);
  } catch {
    throw new MobileAuthenticationError('INVALID_AUTH');
  }

  try {
    await services.appCheck.verifyToken(appCheckToken);
  } catch {
    throw new MobileAuthenticationError('INVALID_APP_CHECK');
  }

  return decoded;
};
