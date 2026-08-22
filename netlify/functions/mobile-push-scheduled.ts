import { createHash } from 'node:crypto';
import type { Config } from '@netlify/functions';
import { Timestamp, type DocumentReference } from 'firebase-admin/firestore';
import type { Message } from 'firebase-admin/messaging';
import { getMobileFirebaseServices, MobileFirebaseConfigurationError } from './mobile-firebase';
import {
  isStoredMobileInstallation,
  type StoredMobileInstallation,
} from './mobile-push-contract';
import {
  decideMobilePushes,
  type MobilePushCandidate,
  type MobileWeatherSnapshot,
} from './mobile-push-engine';
import { fetchMobileWeather } from './mobile-push-weather';
import { safeErrorName, safeText } from './security';

const INSTALLATION_COLLECTION = 'mobilePushInstallations';
const TOKEN_OWNER_COLLECTION = 'mobilePushTokenOwners';
const DELIVERY_COLLECTION = 'mobilePushDeliveries';
const INVALID_TARGET_CODES = new Set([
  'messaging/invalid-recipient',
  'messaging/invalid-registration-token',
  'messaging/registration-token-not-registered',
  'messaging/installation-id-not-registered',
]);

interface InstallationTarget {
  ref: DocumentReference;
  installation: StoredMobileInstallation;
}

interface ClaimedMessage extends InstallationTarget {
  candidate: MobilePushCandidate;
  deliveryRef: DocumentReference;
  message: Message;
}

interface RunSummary {
  installations: number;
  locations: number;
  weatherFailures: number;
  candidates: number;
  deduplicated: number;
  sent: number;
  failed: number;
  invalidTargetsRemoved: number;
  expiredInstallationsRemoved: number;
}

const hash = (value: string): string => createHash('sha256').update(value).digest('hex');

const configuredLimit = (name: string, fallback: number, maximum: number): number => {
  const parsed = Number.parseInt(process.env[name] || '', 10);
  return Number.isSafeInteger(parsed) && parsed > 0 ? Math.min(parsed, maximum) : fallback;
};

const timestampMillis = (value: unknown): number | null => {
  if (value instanceof Timestamp) return value.toMillis();
  if (typeof value === 'object' && value !== null && 'toMillis' in value) {
    const toMillis = (value as { toMillis?: unknown }).toMillis;
    if (typeof toMillis === 'function') {
      const result = toMillis.call(value);
      return typeof result === 'number' && Number.isFinite(result) ? result : null;
    }
  }
  return null;
};

const forEachWithConcurrency = async <T>(
  values: T[],
  concurrency: number,
  callback: (value: T) => Promise<void>
): Promise<void> => {
  let cursor = 0;
  const workers = Array.from({ length: Math.min(concurrency, values.length) }, async () => {
    while (cursor < values.length) {
      const index = cursor;
      cursor += 1;
      await callback(values[index]);
    }
  });
  await Promise.all(workers);
};

const deleteInstallationIfCurrent = async (
  target: InstallationTarget,
  requireExpiredBefore?: number
): Promise<boolean> => {
  const { firestore } = getMobileFirebaseServices();
  return firestore.runTransaction(async (transaction) => {
    const current = await transaction.get(target.ref);
    if (!current.exists) return false;
    const installation = current.data() as StoredMobileInstallation;
    if (
      installation.uid !== target.installation.uid
      || installation.installationId !== target.installation.installationId
      || installation.tokenHash !== target.installation.tokenHash
    ) return false;
    if (requireExpiredBefore !== undefined) {
      const expiresAt = timestampMillis(installation.expiresAt);
      if (expiresAt === null || expiresAt > requireExpiredBefore) return false;
    }

    const ownerRef = firestore.collection(TOKEN_OWNER_COLLECTION).doc(installation.tokenHash);
    const owner = await transaction.get(ownerRef);
    transaction.delete(target.ref);
    const ownerPath = owner.data()?.installationPath;
    if (owner.exists && ownerPath === target.ref.path) transaction.delete(ownerRef);
    return true;
  });
};

const pruneExpiredInstallations = async (nowMs: number): Promise<number> => {
  const { firestore } = getMobileFirebaseServices();
  const snapshots = await firestore
    .collection(INSTALLATION_COLLECTION)
    .where('expiresAt', '<=', Timestamp.fromMillis(nowMs))
    .limit(100)
    .get();
  const targets = snapshots.docs
    .map((document) => ({ ref: document.ref, installation: document.data() }))
    .filter((target): target is InstallationTarget => isStoredMobileInstallation(target.installation));
  let removed = 0;
  await forEachWithConcurrency(targets, 8, async (target) => {
    if (await deleteInstallationIfCurrent(target, nowMs)) removed += 1;
  });
  return removed;
};

const channelFor = (type: MobilePushCandidate['type']): string => {
  if (type === 'severe') return 'meteor_severe';
  if (type === 'rain') return 'meteor_rain';
  if (type === 'daily') return 'meteor_daily';
  return 'meteor_general';
};

const toFcmMessage = (
  installation: StoredMobileInstallation,
  candidate: MobilePushCandidate
): Message => ({
  token: installation.fcmToken,
  notification: { title: candidate.title, body: candidate.body },
  data: {
    type: candidate.type,
    route: candidate.route,
  },
  android: {
    priority: candidate.type === 'severe' || candidate.type === 'rain' ? 'high' : 'normal',
    ttl: Math.max(60_000, Math.min(6 * 60 * 60 * 1_000, (candidate.dedupeUntil * 1_000) - Date.now())),
    collapseKey: candidate.type,
    notification: {
      channelId: channelFor(candidate.type),
      tag: safeText(candidate.dedupeKey, 80),
      sound: 'default',
      priority: candidate.type === 'severe' ? 'max' : 'high',
    },
  },
});

const claimCandidate = async (
  target: InstallationTarget,
  candidate: MobilePushCandidate,
  nowMs: number
): Promise<ClaimedMessage | null> => {
  const { firestore } = getMobileFirebaseServices();
  const deliveryId = hash(`${target.ref.id}\u0000${candidate.dedupeKey}`);
  const deliveryRef = firestore.collection(DELIVERY_COLLECTION).doc(deliveryId);
  const claimed = await firestore.runTransaction(async (transaction) => {
    const delivery = await transaction.get(deliveryRef);
    const expiresAt = timestampMillis(delivery.data()?.expiresAt);
    if (delivery.exists && expiresAt !== null && expiresAt > nowMs) return false;
    transaction.set(deliveryRef, {
      schemaVersion: 1,
      installationPath: target.ref.path,
      type: candidate.type,
      dedupeKey: candidate.dedupeKey,
      status: 'claimed',
      claimedAt: Timestamp.fromMillis(nowMs),
      expiresAt: Timestamp.fromMillis(candidate.dedupeUntil * 1_000),
    });
    return true;
  });
  if (!claimed) return null;
  return {
    ...target,
    candidate,
    deliveryRef,
    message: toFcmMessage(target.installation, candidate),
  };
};

const releaseClaims = async (claims: ClaimedMessage[]): Promise<void> => {
  const { firestore } = getMobileFirebaseServices();
  for (let offset = 0; offset < claims.length; offset += 400) {
    const batch = firestore.batch();
    claims.slice(offset, offset + 400).forEach((claim) => batch.delete(claim.deliveryRef));
    await batch.commit();
  }
};

const sendClaims = async (claims: ClaimedMessage[], summary: RunSummary): Promise<void> => {
  const { firestore, messaging } = getMobileFirebaseServices();
  for (let offset = 0; offset < claims.length; offset += 500) {
    const chunk = claims.slice(offset, offset + 500);
    let result;
    try {
      result = await messaging.sendEach(chunk.map((claim) => claim.message));
    } catch (error) {
      summary.failed += chunk.length;
      await releaseClaims(chunk);
      console.warn(`[MobilePush] FCM batch unavailable (${safeErrorName(error)}).`);
      continue;
    }

    const invalidTargets: InstallationTarget[] = [];
    const batch = firestore.batch();
    result.responses.forEach((sendResult, index) => {
      const claim = chunk[index];
      if (sendResult.success) {
        summary.sent += 1;
        batch.set(claim.deliveryRef, {
          status: 'delivered',
          deliveredAt: Timestamp.now(),
        }, { merge: true });
        return;
      }

      summary.failed += 1;
      const errorCode = safeText(sendResult.error?.code, 100) || 'messaging/unknown-error';
      if (INVALID_TARGET_CODES.has(errorCode)) {
        invalidTargets.push(claim);
        batch.delete(claim.deliveryRef);
      } else {
        // Transient failures may retry on the next schedule. No token, payload,
        // location, or provider message is persisted in diagnostic state.
        batch.delete(claim.deliveryRef);
      }
    });
    await batch.commit();

    await forEachWithConcurrency(invalidTargets, 8, async (target) => {
      if (await deleteInstallationIfCurrent(target)) summary.invalidTargetsRemoved += 1;
    });
  }
};

const runPushSchedule = async (): Promise<RunSummary> => {
  const nowMs = Date.now();
  const maxInstallations = configuredLimit('MOBILE_PUSH_MAX_INSTALLATIONS', 500, 10_000);
  const maxLocations = configuredLimit('MOBILE_PUSH_MAX_LOCATIONS', 60, 500);
  const services = getMobileFirebaseServices();
  if (!(process.env.CLIMA_API || '').trim()) throw new Error('Weather service is not configured');

  const summary: RunSummary = {
    installations: 0,
    locations: 0,
    weatherFailures: 0,
    candidates: 0,
    deduplicated: 0,
    sent: 0,
    failed: 0,
    invalidTargetsRemoved: 0,
    expiredInstallationsRemoved: await pruneExpiredInstallations(nowMs),
  };

  const installationSnapshot = await services.firestore
    .collection(INSTALLATION_COLLECTION)
    .where('enabled', '==', true)
    .limit(maxInstallations)
    .get();
  const targets = installationSnapshot.docs
    .map((document) => ({ ref: document.ref, installation: document.data() }))
    .filter((target): target is InstallationTarget => isStoredMobileInstallation(target.installation));
  summary.installations = targets.length;

  const groups = new Map<string, InstallationTarget[]>();
  for (const target of targets) {
    const key = target.installation.location.key;
    if (!groups.has(key) && groups.size >= maxLocations) continue;
    const group = groups.get(key) || [];
    group.push(target);
    groups.set(key, group);
  }
  summary.locations = groups.size;

  const weatherByLocation = new Map<string, MobileWeatherSnapshot>();
  await forEachWithConcurrency([...groups.entries()], 5, async ([key, group]) => {
    try {
      weatherByLocation.set(key, await fetchMobileWeather(group[0].installation.location));
    } catch (error) {
      summary.weatherFailures += 1;
      console.warn(`[MobilePush] Weather group unavailable (${safeErrorName(error)}).`);
    }
  });

  const pendingClaims: Array<{ target: InstallationTarget; candidate: MobilePushCandidate }> = [];
  for (const [key, group] of groups) {
    const weather = weatherByLocation.get(key);
    if (!weather) continue;
    for (const target of group) {
      const candidates = decideMobilePushes(
        weather,
        target.installation.preferences,
        target.installation.timeZone,
        nowMs
      );
      summary.candidates += candidates.length;
      for (const candidate of candidates) {
        pendingClaims.push({ target, candidate });
      }
    }
  }

  const claims: ClaimedMessage[] = [];
  await forEachWithConcurrency(pendingClaims, 20, async ({ target, candidate }) => {
    const claim = await claimCandidate(target, candidate, nowMs);
    if (claim) claims.push(claim);
    else summary.deduplicated += 1;
  });

  await sendClaims(claims, summary);
  return summary;
};

export default async (): Promise<Response> => {
  try {
    const summary = await runPushSchedule();
    console.info(`[MobilePush] Schedule completed (${JSON.stringify(summary)}).`);
    return Response.json({ ok: true, summary });
  } catch (error) {
    const configurationError = error instanceof MobileFirebaseConfigurationError
      || !(process.env.CLIMA_API || '').trim();
    console.warn(`[MobilePush] Schedule skipped (${safeErrorName(error)}).`);
    return Response.json({
      ok: false,
      code: configurationError ? 'PUSH_NOT_CONFIGURED' : 'PUSH_SCHEDULE_FAILED',
    }, { status: configurationError ? 503 : 500 });
  }
};

export const config: Config = {
  schedule: '@hourly',
};

export { runPushSchedule };
