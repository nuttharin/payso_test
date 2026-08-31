# Payment API (Go + Gin)

Backend for the checkout's payment details form. Validates card payment
submissions and returns the NEO-style envelope the frontend expects.

## Run

```
cd backend
PORT=8080 go run ./cmd/api
```

Health check: `GET /healthz`

## Endpoint

`POST /v1/payments/card`

Request body:

```json
{
  "orderId": "BK-20481",
  "amount": 42.90,
  "email": "name@example.com",
  "cardName": "John Doe",
  "cardNumber": "4242424242424242",
  "expiry": "12 / 30",
  "cvv": "123",
  "country": "TH",
  "postal": "10110",
  "saveCard": false
}
```

Success (`200`):

```json
{
  "status": "success",
  "data": {
    "paymentId": "...",
    "orderId": "BK-20481",
    "amount": 42.9,
    "receiptSentTo": "name@example.com",
    "paidAt": "2026-08-31T15:05:28+07:00",
    "cardBrand": "visa",
    "cardLast4": "4242"
  },
  "message": "การชำระเงินสำเร็จ"
}
```

Error cases:

| Scenario | HTTP status | error_code |
| --- | --- | --- |
| Validation failure (bad email, unsupported card, expired date, bad postal, etc.) | 400 | `VALIDATION_ERROR` |
| Duplicate submission for an already-approved order | 409 | `DUPLICATE_SUBMISSION` |
| Unexpected server error | 500 | `INTERNAL_ERROR` |

There is no real payment provider — any request that passes validation
and isn't a duplicate of an already-approved order is approved. CVV is
only checked for format (3 digits), not matched against any outcome.

`VALIDATION_ERROR` responses also include a `fields` array of
`{ field, message }` so the frontend can attach errors to the matching
form field.

## Config

| Env var | Default | Purpose |
| --- | --- | --- |
| `PORT` | `8080` | HTTP listen port |
| `ALLOWED_ORIGINS` | `http://localhost:3000` | Comma-separated list of origins allowed by CORS |

Set the frontend's `NEXT_PUBLIC_API_BASE_URL` (in `.env.local`) to match
this server's address, e.g. `http://localhost:8080`.
