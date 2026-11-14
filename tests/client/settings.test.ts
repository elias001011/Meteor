import assert from 'node:assert/strict';
import test from 'node:test';
import { importAppData, getSettings } from '../../services/settingsService';
import { safeExternalUrl } from '../../services/urlSafety';
class MemoryStorage {
  values = new Map<string, string>();
  get length() { return this.values.size; }
  key(i: number) { return [...this.values.keys()][i] ?? null; }
  getItem(k: string) { return this.values.get(k) ?? null; }
  setItem(k: string, v: string) { this.values.set(k, v); }
  removeItem(k: string) { this.values.delete(k); }
}
test('backup replaces all weather cache keys and preserves unrelated storage', () => {
  const storage = new MemoryStorage();
  Object.assign(globalThis, { localStorage: storage });
  storage.setItem('weather_data_a', '{}');
  storage.setItem('weather_data_b', '{}');
  storage.setItem('other', 'keep');
  assert.equal(importAppData(JSON.stringify({weatherCache: {weather_data_c: {}}}), {importCache: true, importSettings: false, importChat: false}), true);
  assert.deepEqual([...storage.values.keys()], ['other', 'weather_data_c']);
});
test('backup rejects invalid coordinates and malformed source links', () => {
  const storage = new MemoryStorage();
  Object.assign(globalThis, { localStorage: storage });
  importAppData(JSON.stringify({lastCoords: {lat: 91, lon: 0}, chatHistory: [{role: 'model', text: 'hi', sources: [null, {uri: 'javascript:alert(1)'}, {uri: 'https://example.com'}]}]}), {importChat: true, importSettings: false, importCache: false});
  assert.equal(storage.getItem('last_coords'), null);
  assert.deepEqual(JSON.parse(storage.getItem('chat_history')!)[0].sources, [{uri: 'https://example.com/', title: 'Fonte'}]);
});
test('external links reject schemes, credentials and malformed values', () => {
  for (const value of [null, {}, 'javascript:alert(1)', 'file:///etc/passwd', 'https://user:pass@example.com']) assert.equal(safeExternalUrl(value), undefined);
  assert.equal(safeExternalUrl('https://example.com'), 'https://example.com/');
});

test('light appearance survives settings and backup validation', () => {
  const storage = new MemoryStorage();
  Object.assign(globalThis, { localStorage: storage });
  importAppData(JSON.stringify({settings: {backgroundMode: 'light'}}), {importSettings: true, importChat: false, importCache: false});
  assert.equal(getSettings().backgroundMode, 'light');
  assert.equal(JSON.parse(storage.getItem('meteor_settings')!).backgroundMode, 'light');
});
