import {
  DEFAULT_MOBILE_NOTIFICATION_PREFERENCES,
  type MobileNotificationPreferences,
} from './mobile-push-engine';

export interface MobileLocation {
  latitude: number;
  longitude: number;
  key: string;
}

export interface MobileInstallationInput {
  installationId: string;
  fcmToken: string;
  location: MobileLocation;
  timeZone: string;
  preferences: MobileNotificationPreferences;
  locale: string;
  appVersion: string;
}

export interface MobileInstallationPatch {
  installationId: string;
  fcmToken?: string;
  location?: MobileLocation;
  timeZone?: string;
  preferences?: Partial<MobileNotificationPreferences>;
  locale?: string;
  appVersion?: string;
}

export interface StoredMobileInstallation {
  schemaVersion: 1;
  uid: string;
  installationId: string;
  fcmToken: string;
  tokenHash: string;
  location: MobileLocation;
  timeZone: string;
  preferences: MobileNotificationPreferences;
  locale: string;
  appVersion: string;
  platform: 'android';
  enabled: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
  lastSeenAt?: unknown;
  expiresAt?: unknown;
}

export class MobilePayloadError extends Error {
  constructor(public readonly field: string) {
    super(`Invalid mobile push field: ${field}`);
    this.name = 'MobilePayloadError';
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
);

const assertKnownKeys = (value: Record<string, unknown>, known: readonly string[], field: string): void => {
  if (Object.keys(value).some((key) => !known.includes(key))) throw new MobilePayloadError(field);
};

const numberInRange = (value: unknown, min: number, max: number, field: string): number => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
    throw new MobilePayloadError(field);
  }
  return value;
};

const booleanValue = (value: unknown, field: string): boolean => {
  if (typeof value !== 'boolean') throw new MobilePayloadError(field);
  return value;
};

const integerHour = (value: unknown, field: string): number => {
  const hour = numberInRange(value, 0, 23, field);
  if (!Number.isInteger(hour)) throw new MobilePayloadError(field);
  return hour;
};

export const parseInstallationId = (value: unknown): string => {
  if (typeof value !== 'string') throw new MobilePayloadError('installationId');
  const id = value.trim();
  if (!/^[A-Za-z0-9_-]{16,128}$/.test(id)) throw new MobilePayloadError('installationId');
  return id;
};

export const parseFcmToken = (value: unknown): string => {
  if (typeof value !== 'string') throw new MobilePayloadError('fcmToken');
  const token = value.trim();
  if (token.length < 20 || token.length > 4_096 || /[\s\u0000-\u001f\u007f]/.test(token)) {
    throw new MobilePayloadError('fcmToken');
  }
  return token;
};

export const parseLocation = (value: unknown): MobileLocation => {
  if (!isRecord(value)) throw new MobilePayloadError('location');
  assertKnownKeys(value, ['latitude', 'longitude'], 'location');
  const rawLatitude = numberInRange(value.latitude, -90, 90, 'location.latitude');
  const rawLongitude = numberInRange(value.longitude, -180, 180, 'location.longitude');
  const latitude = Number(rawLatitude.toFixed(2)) || 0;
  const longitude = Number(rawLongitude.toFixed(2)) || 0;
  return { latitude, longitude, key: `${latitude.toFixed(2)},${longitude.toFixed(2)}` };
};

export const parseTimeZone = (value: unknown): string => {
  if (typeof value !== 'string' || value.length > 80) throw new MobilePayloadError('timeZone');
  const timeZone = value.trim();
  if (!timeZone) throw new MobilePayloadError('timeZone');
  try {
    return new Intl.DateTimeFormat('en', { timeZone }).resolvedOptions().timeZone;
  } catch {
    throw new MobilePayloadError('timeZone');
  }
};

const PREFERENCE_KEYS = [
  'severeAlerts', 'rainSoon', 'dailySummary', 'temperature', 'uv', 'wind',
  'dailySummaryHour', 'quietHoursEnabled',
  'quietStartHour', 'quietEndHour', 'coldThresholdC', 'heatThresholdC',
  'uvThreshold', 'windThresholdKmh',
] as const;

export const parsePreferencesPatch = (value: unknown): Partial<MobileNotificationPreferences> => {
  if (!isRecord(value)) throw new MobilePayloadError('preferences');
  assertKnownKeys(value, PREFERENCE_KEYS, 'preferences');
  if (Object.keys(value).length === 0) throw new MobilePayloadError('preferences');

  const result: Partial<MobileNotificationPreferences> = {};
  for (const key of ['severeAlerts', 'rainSoon', 'dailySummary', 'temperature', 'uv', 'wind'] as const) {
    if (key in value) result[key] = booleanValue(value[key], `preferences.${key}`);
  }
  if ('dailySummaryHour' in value) result.dailySummaryHour = integerHour(value.dailySummaryHour, 'preferences.dailySummaryHour');
  if ('quietHoursEnabled' in value) result.quietHoursEnabled = booleanValue(value.quietHoursEnabled, 'preferences.quietHoursEnabled');
  if ('quietStartHour' in value) result.quietStartHour = integerHour(value.quietStartHour, 'preferences.quietStartHour');
  if ('quietEndHour' in value) result.quietEndHour = integerHour(value.quietEndHour, 'preferences.quietEndHour');
  if ('coldThresholdC' in value) result.coldThresholdC = numberInRange(value.coldThresholdC, -50, 20, 'preferences.coldThresholdC');
  if ('heatThresholdC' in value) result.heatThresholdC = numberInRange(value.heatThresholdC, 25, 60, 'preferences.heatThresholdC');
  if ('uvThreshold' in value) result.uvThreshold = numberInRange(value.uvThreshold, 3, 15, 'preferences.uvThreshold');
  if ('windThresholdKmh' in value) result.windThresholdKmh = numberInRange(value.windThresholdKmh, 20, 200, 'preferences.windThresholdKmh');
  return result;
};

export const mergePreferences = (
  base: MobileNotificationPreferences,
  patch: Partial<MobileNotificationPreferences>
): MobileNotificationPreferences => {
  const merged = { ...base, ...patch };
  if (merged.coldThresholdC >= merged.heatThresholdC) throw new MobilePayloadError('preferences');
  return merged;
};

const parseLocale = (value: unknown): string => {
  if (typeof value !== 'string') throw new MobilePayloadError('locale');
  const locale = value.trim();
  if (!/^[a-z]{2,3}(?:-[A-Z]{2})?$/.test(locale)) throw new MobilePayloadError('locale');
  return locale;
};

const parseAppVersion = (value: unknown): string => {
  if (typeof value !== 'string') throw new MobilePayloadError('appVersion');
  const version = value.trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9.+_-]{0,39}$/.test(version)) throw new MobilePayloadError('appVersion');
  return version;
};

export const parseCreateInstallation = (value: unknown): MobileInstallationInput => {
  if (!isRecord(value)) throw new MobilePayloadError('body');
  assertKnownKeys(value, [
    'installationId', 'fcmToken', 'location', 'timeZone', 'preferences', 'locale', 'appVersion',
  ], 'body');
  const preferences = value.preferences === undefined
    ? DEFAULT_MOBILE_NOTIFICATION_PREFERENCES
    : mergePreferences(DEFAULT_MOBILE_NOTIFICATION_PREFERENCES, parsePreferencesPatch(value.preferences));
  return {
    installationId: parseInstallationId(value.installationId),
    fcmToken: parseFcmToken(value.fcmToken),
    location: parseLocation(value.location),
    timeZone: parseTimeZone(value.timeZone),
    preferences,
    locale: value.locale === undefined ? 'pt-BR' : parseLocale(value.locale),
    appVersion: parseAppVersion(value.appVersion),
  };
};

export const parsePatchInstallation = (value: unknown): MobileInstallationPatch => {
  if (!isRecord(value)) throw new MobilePayloadError('body');
  assertKnownKeys(value, [
    'installationId', 'fcmToken', 'location', 'timeZone', 'preferences', 'locale', 'appVersion',
  ], 'body');
  const result: MobileInstallationPatch = { installationId: parseInstallationId(value.installationId) };
  if ('fcmToken' in value) result.fcmToken = parseFcmToken(value.fcmToken);
  if ('location' in value) result.location = parseLocation(value.location);
  if ('timeZone' in value) result.timeZone = parseTimeZone(value.timeZone);
  if ('preferences' in value) result.preferences = parsePreferencesPatch(value.preferences);
  if ('locale' in value) result.locale = parseLocale(value.locale);
  if ('appVersion' in value) result.appVersion = parseAppVersion(value.appVersion);
  if (Object.keys(result).length === 1) throw new MobilePayloadError('body');
  return result;
};

export const parseDeleteInstallation = (value: unknown): string => {
  if (!isRecord(value)) throw new MobilePayloadError('body');
  assertKnownKeys(value, ['installationId'], 'body');
  return parseInstallationId(value.installationId);
};

export const isStoredMobileInstallation = (value: unknown): value is StoredMobileInstallation => {
  if (!isRecord(value)) return false;
  try {
    return value.schemaVersion === 1
      && typeof value.uid === 'string' && value.uid.length > 0
      && parseInstallationId(value.installationId) === value.installationId
      && parseFcmToken(value.fcmToken) === value.fcmToken
      && typeof value.tokenHash === 'string' && /^[a-f0-9]{64}$/.test(value.tokenHash)
      && isRecord(value.location)
      && typeof value.location.key === 'string'
      && parseLocation({
        latitude: value.location.latitude,
        longitude: value.location.longitude,
      }).key === value.location.key
      && parseTimeZone(value.timeZone) === value.timeZone
      && Boolean(mergePreferences(DEFAULT_MOBILE_NOTIFICATION_PREFERENCES, parsePreferencesPatch(value.preferences)))
      && typeof value.locale === 'string'
      && typeof value.appVersion === 'string'
      && value.platform === 'android'
      && value.enabled === true;
  } catch {
    return false;
  }
};
