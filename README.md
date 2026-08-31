# PaySo

Checkout & card payment demo app: a Next.js frontend backed by a Go + Gin
payment API. Built as a QA/interview-style exercise around a card payment
form — client-side validation, a matching server-side validation layer, and
a NEO-style JSON response envelope shared by both.

## Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS,
  `react-hook-form` + `zod`
- **Backend**: Go 1.26, Gin, `go-playground/validator`
- **Data**: in-memory repository (no database) — payments are not persisted
  across restarts

## Project Structure

```
src/
  app/                    # Next.js routes (App Router)
  components/
    ui/                   # reusable presentational components
    features/checkout/    # checkout-specific components (form, summary, etc.)
  data/                   # mock data (stand-in for a real order service)
  lib/
    api/                  # API client (calls the Go backend)
    payment/              # schema, validators, coupon logic shared by the form
  types/                  # shared TypeScript types (checkout, payment, API envelope)

backend/
  cmd/api/                # entrypoint (router + server wiring, graceful shutdown)
  config/                 # env-based config loading
  internal/
    handler/              # HTTP handlers (Gin)
    service/              # business logic + card validation
    repository/           # in-memory data access
    model/                 # domain structs
    dto/                  # request/response structs
    middleware/            # CORS
    router/                # route registration
```

## Getting Started

### Run Backend

```bash
cd backend
go run ./cmd/api
```

Runs on `http://localhost:8080`. Health check: `GET /healthz`.
See [`backend/README.md`](backend/README.md) for the full API reference.

### Run Frontend

```bash
cp .env.local.example .env.local
npm install
npm run dev
```

Runs on `http://localhost:3000`.

Run both at the same time (backend first, then frontend) — the frontend
calls the backend at `NEXT_PUBLIC_API_BASE_URL` (set in `.env.local`,
defaults to `http://localhost:8080`).

## API Contract

Both layers agree on a single response envelope:

```json
{ "status": "success", "data": {}, "message": "" }
```

```json
{ "status": "error", "data": null, "message": "human readable message", "error_code": "USER_NOT_FOUND" }
```

Main endpoint: `POST /v1/payments/card` — submits the card payment form.
Card number/expiry/postal-code validation rules are mirrored between
`src/lib/payment/validators.ts` (frontend) and
`backend/internal/service/card_validation.go` (backend) so both sides
reject the same inputs.

There is no real payment provider integration — any request that passes
validation and isn't a duplicate of an already-approved order is approved.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | Run ESLint |

## Notes

- Order data on the checkout page is mocked in `src/data/checkout-mock.ts`
  (no orders backend yet).
- Payments are stored in memory on the Go backend and reset on restart.
