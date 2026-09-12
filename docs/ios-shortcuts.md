# iOS Shortcuts expense import

Vault exposes `POST /api/shortcuts/expenses` for creating an expense from an iOS Shortcut.

Configure these server environment variables:

- `SHORTCUTS_API_TOKEN`: a long random secret used as a Bearer token.
- `SHORTCUTS_USER_EMAIL`: the Vault account that owns imported transactions.

Send a JSON request with an `Authorization: Bearer <SHORTCUTS_API_TOKEN>` header:

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

On success, the endpoint returns HTTP 200 with `{ "ok": true, "transaction": ... }`. Invalid requests return HTTP 422; an invalid token returns HTTP 401.
