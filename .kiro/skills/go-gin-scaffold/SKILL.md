---
name: go-gin-scaffold
description: >-
  Scaffold a new REST resource (model, dto, repository, service, handler, router
  wiring, main.go DI) for a Go+Gin backend, following this project's layered
  architecture (handler -> service -> repository), NEO-style response envelope,
  and typed-error conventions. Use when user asks to add a new endpoint/resource
  to the Go+Gin backend, e.g. "เพิ่ม endpoint ใหม่ใน backend", "สร้าง resource ใหม่
  แบบ payment", "add a new Go Gin handler/service/repository", "scaffold CRUD for X".
---

# go-gin-scaffold

Generate a new resource's full vertical slice (model → repository → service →
handler → router → main.go wiring) for a Go+Gin backend, matching the patterns
already established in this codebase (see `backend/internal/*/payment_*.go` as
the canonical reference implementation).

## Quick start

```
เพิ่ม endpoint ใหม่สำหรับ orders แบบเดียวกับ payment
scaffold a resource called "coupon": GET/POST /v1/coupons
add CRUD for user-orders
```

## Workflow

### Step 1 — Learn the project's actual conventions (don't assume)

Read before writing anything:
1. `go.mod` → module name (import path prefix for all new files)
2. `internal/handler/response.go` → confirm `Success`/`Error` helper signatures; reuse them, never `c.JSON(...)` directly
3. `internal/service/errors.go` (or equivalent) → the typed error pattern (`ErrorCode` consts + a `*XxxError` struct + `AsXxxError` recovery helper). Mirror this pattern for the new resource — reuse the existing error type if one already fits the domain, otherwise add new `ErrCode*` consts to the existing file rather than creating a parallel error system
4. `internal/dto/validation.go` → reuse `FormatValidationErrors` (or equivalent) for 400 field-level errors instead of writing a new formatter
5. `internal/router/router.go` and `cmd/api/main.go` → see how existing handlers are grouped/wired, to insert the new resource consistently
6. Any repository implementation present (in-memory map, GORM, sqlx) → match the same persistence approach unless the user asks for a different one

### Step 2 — Confirm resource shape with what's inferable

From the user's request, determine:
- Resource name (singular + plural, e.g. `coupon` / `coupons`)
- Route path: plural, kebab-case, versioned — `/v1/<resource-plural>`
- Which REST verbs are needed (don't generate unused CRUD methods)
- Request/response fields — ask the user if not specified, or infer from context (e.g. an existing frontend type in `src/types/`)

### Step 3 — Generate files in dependency order

Create in this order so each file only imports what already exists:

1. `internal/model/<resource>.go` — domain struct + any status/enum types
2. `internal/dto/<resource>_dto.go` — request struct(s) with `binding:` tags, response struct(s) with `json:` tags. Never expose the model struct directly.
3. `internal/repository/<resource>_repository.go` — interface (`-er`-suffixed methods aren't required, but the repo type itself should be an interface) + one concrete implementation. Return domain model + error only — no leaking DB/query types.
4. `internal/service/<resource>_service.go` — interface + impl. Business validation beyond binding tags lives here. Wrap DB errors with `fmt.Errorf("<action>: %w", err)`. Return typed errors (Step 1.3) for anything the handler needs to map to a specific HTTP status.
5. `internal/handler/<resource>_handler.go` — bind DTO, call service, map errors via a `respondError` switch (mirror the existing handler's pattern), call `Success`/`SuccessWithStatus` on the happy path.
6. Wire into `internal/router/router.go`: add to `Deps` struct, register routes under the versioned group.
7. Wire into `cmd/api/main.go`: repository → service → handler construction, in that order, passed into `router.Deps`.

See [REFERENCE.md](REFERENCE.md) for annotated code templates for every file in this list.

### Step 4 — Verify

Run after generating:
```bash
cd backend && gofmt -l . && go build ./... && go vet ./...
```
Fix any output before presenting the result. If `golangci-lint` is configured, run it too.

## Key rules (do not deviate)

- Layers call one direction only: `handler → service → repository`. Never let a handler call a repository directly, or a repository call back into service.
- Every response goes through the shared `response.Success`/`response.Error` helpers — one envelope shape for the whole API.
- HTTP status must reflect the real outcome (400/401/403/404/409/422/500) — never 200 with a hidden error.
- Request/response DTOs are separate structs from `internal/model` — always.
- New error codes go into the existing errors file as additional `ErrorCode` consts + constructor funcs, following the existing `*Error` struct shape — don't invent a second error convention.
- Route naming: plural, kebab-case, grouped under `/v1`.
- Doc comments on every exported identifier, starting with that identifier's name (matches existing style).
- Don't add tests unless the user asks, or the project already has tests for sibling resources — if it does, add matching tests for the new one.
- If the user's request implies a frontend type already exists (`src/types/*.ts`), read it and keep field names/casing consistent with what `lib/api/*.ts` already sends, rather than inventing new field names.

See [REFERENCE.md](REFERENCE.md) for full per-layer code templates.
