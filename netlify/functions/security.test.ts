import assert from 'node:assert/strict';
import test from 'node:test';
import type { HandlerEvent } from '@netlify/functions';
import {
    createApiHeaders,
    errorResponse,
    parseRateLimitState,
    safeText,
    sanitizeExternalUrl,
} from './security.js';

const event = (origin?: string): HandlerEvent => ({
    rawUrl: 'https://meteor.example/.netlify/functions/weather',
    headers: origin ? { origin } : {},
} as HandlerEvent);

test('safeText removes unsafe control characters and enforces its limit', () => {
    assert.equal(safeText('  clima\u0000 seguro  ', 20), 'clima seguro');
    assert.equal(safeText('previsão longa', 8), 'previsão');
    assert.equal(safeText(123, 20), '');
});

test('sanitizeExternalUrl only accepts credential-free HTTP(S) URLs', () => {
    assert.equal(sanitizeExternalUrl('javascript:alert(1)'), null);
    assert.equal(sanitizeExternalUrl('https://user:pass@example.com/path'), null);
    assert.equal(sanitizeExternalUrl('https://example.com/noticia#fragmento'), 'https://example.com/noticia');
});

test('parseRateLimitState accepts the versioned JSON shape and rejects malformed state', () => {
    assert.deepEqual(parseRateLimitState('{"windowId":42,"count":3}'), { windowId: 42, count: 3 });
    assert.equal(parseRateLimitState('{"windowId":42,"count":-1}'), null);
    assert.equal(parseRateLimitState('not-json'), null);
});

test('CORS reflects the same site origin and never reflects an unapproved site', () => {
    const approved = createApiHeaders(event('https://meteor.example'));
    assert.equal(approved['Access-Control-Allow-Origin'], 'https://meteor.example');
    assert.equal(approved['X-API-Version'], '1');

    const rejected = createApiHeaders(event('https://attacker.example'));
    assert.equal(rejected['Access-Control-Allow-Origin'], undefined);
});

test('errorResponse keeps the legacy message and adds a stable v1 error envelope', () => {
    const response = errorResponse(event(), 400, 'INVALID_INPUT', 'Entrada inválida.');
    const body = JSON.parse(response.body || '{}');
    assert.equal(response.statusCode, 400);
    assert.equal(body.message, 'Entrada inválida.');
    assert.equal(body.error.code, 'INVALID_INPUT');
    assert.equal(typeof body.error.requestId, 'string');
});
