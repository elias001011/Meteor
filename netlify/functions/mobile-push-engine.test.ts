import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DEFAULT_MOBILE_NOTIFICATION_PREFERENCES,
  decideMobilePushes,
  isCriticalOfficialAlert,
  isQuietHour,
  localDateHour,
  type MobileWeatherSnapshot,
} from './mobile-push-engine.js';
import {
  MobilePayloadError,
  parseCreateInstallation,
  parsePatchInstallation,
} from './mobile-push-contract.js';
import { parseOpenWeatherSnapshot } from './mobile-push-weather.js';
import {
  getMobileFirebaseServices,
  MobileFirebaseConfigurationError,
} from './mobile-firebase.js';

const NOW = Date.parse('2026-08-22T10:00:00.000Z'); // 07:00 in São Paulo.

const snapshot = (overrides: Partial<MobileWeatherSnapshot> = {}): MobileWeatherSnapshot => ({
  observedAt: Math.floor(NOW / 1_000),
  temperatureC: 22,
  feelsLikeC: 22,
  uvIndex: 2,
  windSpeedKmh: 12,
  windGustKmh: 18,
  description: 'céu limpo',
  hourly: [],
  daily: [{
    dt: Math.floor(NOW / 1_000),
    minTemperatureC: 16,
    maxTemperatureC: 27,
    precipitationProbability: 0.2,
    uvIndex: 5,
    description: 'parcialmente nublado',
  }],
  alerts: [],
  ...overrides,
});

test('quiet hours support an overnight interval and treat equal ends as disabled', () => {
  assert.equal(isQuietHour(23, 22, 7), true);
  assert.equal(isQuietHour(4, 22, 7), true);
  assert.equal(isQuietHour(7, 22, 7), false);
  assert.equal(isQuietHour(14, 9, 17), true);
  assert.equal(isQuietHour(2, 0, 0), false);
});

test('timezone conversion drives the local summary date and hour', () => {
  assert.deepEqual(localDateHour(NOW, 'America/Sao_Paulo'), { date: '2026-08-22', hour: 7 });
  assert.deepEqual(localDateHour(NOW, 'Asia/Tokyo'), { date: '2026-08-22', hour: 19 });
});

test('daily summary is emitted once with a stable local-date key at 07:00', () => {
  const candidates = decideMobilePushes(
    snapshot(),
    { ...DEFAULT_MOBILE_NOTIFICATION_PREFERENCES, rainSoon: false },
    'America/Sao_Paulo',
    NOW
  );
  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].type, 'daily');
  assert.equal(candidates[0].dedupeKey, 'daily:2026-08-22');
  assert.match(candidates[0].body, /Mínima de 16° e máxima de 27°/);

  const oneHourLater = decideMobilePushes(
    snapshot(),
    { ...DEFAULT_MOBILE_NOTIFICATION_PREFERENCES, rainSoon: false },
    'America/Sao_Paulo',
    NOW + 3_600_000
  );
  assert.deepEqual(oneHourLater, []);
});

test('rain soon considers the next three hours and applies a six-hour cooldown key', () => {
  const nowSeconds = Math.floor(NOW / 1_000);
  const candidates = decideMobilePushes(snapshot({
    hourly: [{
      dt: nowSeconds + 2_700,
      temperatureC: 21,
      precipitationProbability: 0.82,
      rainMm: 0,
      snowMm: 0,
      description: 'chuva',
    }],
  }), {
    ...DEFAULT_MOBILE_NOTIFICATION_PREFERENCES,
    dailySummary: false,
  }, 'America/Sao_Paulo', NOW);
  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].type, 'rain');
  assert.equal(candidates[0].dedupeKey, 'rain-soon');
  assert.match(candidates[0].body, /82%.*45 min/);
});

test('only a critical official alert bypasses quiet hours', () => {
  const midnightInSaoPaulo = Date.parse('2026-08-22T03:00:00.000Z');
  const nowSeconds = Math.floor(midnightInSaoPaulo / 1_000);
  const baseAlert = {
    senderName: 'Autoridade local',
    description: 'Acompanhe as orientações oficiais.',
    start: nowSeconds - 60,
    end: nowSeconds + 3_600,
    tags: [] as string[],
  };
  const result = decideMobilePushes(snapshot({
    alerts: [
      { ...baseAlert, event: 'Aviso amarelo de chuva' },
      { ...baseAlert, event: 'Alerta vermelho de tempestade severa' },
    ],
  }), {
    ...DEFAULT_MOBILE_NOTIFICATION_PREFERENCES,
    rainSoon: false,
    dailySummary: false,
  }, 'America/Sao_Paulo', midnightInSaoPaulo);

  assert.equal(result.length, 1);
  assert.match(result[0].title, /vermelho/i);
  assert.equal(result[0].bypassQuietHours, true);
  assert.equal(isCriticalOfficialAlert({ ...baseAlert, event: 'Aviso amarelo' }), false);
});

test('opt-in environmental thresholds create bounded, deterministic alerts', () => {
  const candidates = decideMobilePushes(snapshot({
    temperatureC: 37,
    feelsLikeC: 41,
    uvIndex: 10,
    windGustKmh: 72,
  }), {
    ...DEFAULT_MOBILE_NOTIFICATION_PREFERENCES,
    rainSoon: false,
    dailySummary: false,
    temperature: true,
    uv: true,
    wind: true,
  }, 'America/Sao_Paulo', NOW);
  assert.deepEqual(candidates.map((candidate) => candidate.type), ['temperature', 'uv', 'wind']);
  assert.equal(candidates.every((candidate) => candidate.body.length <= 180), true);
});

test('registration validation rounds coordinates and rejects unknown or unsafe fields', () => {
  const input = parseCreateInstallation({
    installationId: 'cVh2Yx0abcDEFghiJKLMNO',
    fcmToken: 'safe-fcm-token-value-with-enough-characters:APA91_test',
    location: { latitude: -23.55052, longitude: -46.633308 },
    timeZone: 'America/Sao_Paulo',
    preferences: { severeAlerts: true, quietStartHour: 23 },
    locale: 'pt-BR',
    appVersion: '1.0.0+1',
  });
  assert.deepEqual(input.location, {
    latitude: -23.55,
    longitude: -46.63,
    key: '-23.55,-46.63',
  });
  assert.equal(input.preferences.quietStartHour, 23);
  assert.equal(input.preferences.heatThresholdC, 35);

  assert.throws(() => parseCreateInstallation({ ...input, secret: 'must-not-pass' }), MobilePayloadError);
  assert.throws(() => parseCreateInstallation({
    ...input,
    location: { latitude: 91, longitude: 0 },
  }), MobilePayloadError);
});

test('patch validation requires an actual change and enforces threshold ranges', () => {
  assert.throws(() => parsePatchInstallation({
    installationId: 'cVh2Yx0abcDEFghiJKLMNO',
  }), MobilePayloadError);
  assert.throws(() => parsePatchInstallation({
    installationId: 'cVh2Yx0abcDEFghiJKLMNO',
    preferences: { uvThreshold: 30 },
  }), MobilePayloadError);
  assert.deepEqual(parsePatchInstallation({
    installationId: 'cVh2Yx0abcDEFghiJKLMNO',
    preferences: { wind: true, windThresholdKmh: 80 },
  }).preferences, { wind: true, windThresholdKmh: 80 });
});

test('OpenWeather parser converts wind units and bounds provider data', () => {
  const parsed = parseOpenWeatherSnapshot({
    current: {
      dt: 1_700_000_000,
      temp: 30,
      feels_like: 33,
      uvi: 9,
      wind_speed: 10,
      wind_gust: 15,
      weather: [{ description: 'chuva forte' }],
    },
    hourly: [{
      dt: 1_700_000_900,
      temp: 29,
      pop: 1.4,
      rain: { '1h': 2.5 },
      weather: [{ description: 'chuva' }],
    }],
    daily: [{
      dt: 1_700_000_000,
      temp: { min: 23, max: 32 },
      pop: 0.7,
      uvi: 10,
      weather: [{ description: 'tempestade' }],
    }],
    alerts: [{
      sender_name: 'Defesa Civil',
      event: 'Tempestade severa',
      start: 1_700_000_000,
      end: 1_700_003_600,
      description: 'Procure abrigo.',
      tags: ['Severe'],
    }],
  });
  assert.equal(parsed.windSpeedKmh, 36);
  assert.equal(parsed.windGustKmh, 54);
  assert.equal(parsed.hourly[0].precipitationProbability, 1);
  assert.equal(parsed.alerts[0].senderName, 'Defesa Civil');
});

test('Firebase Admin fails closed when its server-only credential is absent', () => {
  const original = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  try {
    assert.throws(() => getMobileFirebaseServices(), MobileFirebaseConfigurationError);
  } finally {
    if (original === undefined) delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    else process.env.FIREBASE_SERVICE_ACCOUNT_JSON = original;
  }
});
