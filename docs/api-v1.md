# Meteor BFF API v1

The web client and the Android client use the same Netlify Functions backend. Existing function URLs remain stable and successful responses include `X-API-Version: 1`.

## Compatibility rules

- Existing top-level response fields are preserved.
- New optional fields may be added without a version change.
- Errors always retain the legacy top-level `message` and also include a structured envelope:

```json
{
  "message": "Human-readable message in Portuguese.",
  "error": {
    "code": "STABLE_MACHINE_CODE",
    "message": "Human-readable message in Portuguese.",
    "requestId": "request correlation ID"
  }
}
```

- `429` responses include `Retry-After`, `X-RateLimit-Limit`, and `X-RateLimit-Remaining`.
- Upstream failures do not expose provider responses, API keys, stack traces, or configuration details.

## CORS

Same-origin calls work without configuration. Cross-origin browser clients are reflected only when their exact origin is one of:

- `METEOR_ALLOWED_ORIGINS` (comma-separated origins);
- Netlify's `URL`, `DEPLOY_URL`, or `DEPLOY_PRIME_URL`;
- the origin of the current Function URL;
- localhost/loopback for local development.

Native Android HTTP calls do not require CORS. No credentialed cross-origin requests are enabled.

## Weather

`GET /.netlify/functions/weather`

### `endpoint=all`

Required: `lat`, `lon`. Optional: `q`, `country`, `source=auto|onecall|free|open-meteo`.

The response keeps `weatherData`, `airQualityData`, `hourlyForecast`, `dailyForecast`, `alerts`, `dataSource`, and `fallbackStatus`. `weatherData` also returns:

```json
{
  "imageUrl": "https://images.unsplash.com/...",
  "imageFallbackUrl": "https://picsum.photos/seed/.../1600/1000",
  "imageAttribution": {
    "source": "unsplash",
    "photographer": "Name",
    "photographerUrl": "https://unsplash.com/@name?...",
    "photoUrl": "https://unsplash.com/photos/id?..."
  }
}
```

The UI must show the Unsplash attribution when `source` is `unsplash`. If the primary image and Picsum fallback both fail, the UI should retain its CSS gradient rather than fetch another untrusted URL.

The server recognizes the corrected `UNSPLASH_ACCESS_KEY` and temporarily supports the legacy misspelling `UNSPLASH_ACESS_KEY`.

### Other endpoints

- `endpoint=direct&q=...&limit=1..10`: sanitized city search.
- `endpoint=reverse&lat=...&lon=...&limit=1..10`: reverse geocoding.
- `endpoint=tile&layer=TA2|CL|PR0|APM|WS10&z=...&x=...&y=...`: validated PNG weather tile.
- `endpoint=relief&z=...&x=...&y=...`: optional validated PNG relief tile.

## News

`GET /.netlify/functions/news`

- `endpoint=top-headlines&category=...&lang=pt&country=br&max=1..20`
- `endpoint=search&q=...&lang=pt&country=br&max=1..20`

The successful shape remains `{ "totalArticles": number, "articles": NewsArticle[] }`. URLs, text lengths, locale codes, categories, dates, and result counts are validated. The secondary GNews key is tried only when the primary key is quota-limited, unauthorized, or temporarily unavailable.

## Gemini

`POST /.netlify/functions/gemini`

```json
{
  "prompt": "required string",
  "history": [{ "role": "user|model", "parts": [{ "text": "..." }] }],
  "weatherContext": {},
  "timeContext": "optional display time",
  "userInstructions": "optional response preferences"
}
```

Successful responses retain `text`, `model`, `processingTime`, `toolUsed`, and `sources`. The backend applies a total deadline, per-call timeouts, bounded retries, model fallback, output limits, weather-context normalization, prompt-size limits, response safety checks, and Google Search grounding. Provider error details are server-only.

The optional `GEMINI_MODEL` selects the first model attempted. Compatible fallback models remain server-controlled so a client release is not required when a model is retired.
