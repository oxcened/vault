# iOS Shortcuts expense import

Vault exposes `POST /api/shortcuts/expenses` for creating an expense from an iOS Shortcut. Each Vault user creates and manages their own tokens from **Settings → iOS Shortcuts**.

Send a JSON request with an `Authorization: Bearer <token>` header:

```json
{
  "amount": 12.5,
  "currency": "EUR",
  "description": "Coffee",
  "timestamp": "2026-09-12T08:30:00+02:00",
  "category": "Eating Out & Bars"
}
```

`date` may be used instead of `timestamp`. The category may be its name or ID. If omitted, Vault uses `Other & Unexpected`.

Tokens are stored as hashes and displayed only once when created. On success, the endpoint returns HTTP 200 with `{ "ok": true, "transaction": ... }`. Invalid requests return HTTP 422; an invalid or revoked token returns HTTP 401.
