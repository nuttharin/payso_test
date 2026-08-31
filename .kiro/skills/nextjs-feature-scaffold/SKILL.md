---
name: nextjs-feature-scaffold
description: >-
  Scaffold a new Next.js App Router feature (route/page, feature components,
  types, API client function, Zod schema + react-hook-form) for this project's
  frontend, following the existing checkout feature as the reference pattern
  (Server Component page -> "use client" feature components -> lib/api client
  wrapping the NEO-style backend envelope). Use when user asks to add a new
  page/feature/route to the frontend, e.g. "เพิ่มหน้าใหม่", "สร้าง feature ใหม่
  ใน frontend", "add a new Next.js page/component", "scaffold a form ด้วย
  react-hook-form + zod", "เชื่อม API ใหม่กับ backend".
---

# nextjs-feature-scaffold

Generate a new frontend feature's full vertical slice (types → API client →
validation schema → components → route) matching the patterns already
established in this codebase (see `src/components/features/checkout/*` and
`src/lib/api/*` as the canonical reference implementation).

## Quick start

```
เพิ่มหน้า /profile ที่ดึงข้อมูล user จาก backend
scaffold a "coupon-history" feature: list of past coupons under /account
add a new form for shipping address using react-hook-form + zod
```

## Workflow

### Step 1 — Learn the project's actual conventions (don't assume)

Read before writing anything:
1. `package.json` → confirm which libraries are **actually installed**
   (`react-hook-form`, `zod`, `@hookform/resolvers` are present; `@tanstack/react-query`
   and `zustand` are mentioned in steering but may not be installed yet — don't
   import them speculatively. If the feature genuinely needs one, ask the user
   before adding a new dependency).
2. Lockfile present at repo root (`package-lock.json` vs `pnpm-lock.yaml`) →
   use whichever package manager matches the existing lockfile, not the
   steering default, since steering itself only prefers pnpm "if no other
   lockfile already exists."
3. `tsconfig.json` → confirm the `@/*` path alias maps to `src/*`; use it for
   all internal imports instead of relative `../../..` paths.
4. `src/lib/api/client.ts` → the shared `apiFetch<T>()` wrapper and `ApiError`
   class. Every new backend call goes through `apiFetch`, never a bare `fetch`.
5. `src/types/api.ts` → the generic `ApiResponse<T>` envelope type matching the
   backend's NEO-style response (see steering: backend-golang-gin).
6. An existing feature folder (e.g. `src/components/features/checkout/`) →
   see how Server/Client components split, how props types are named, and how
   a feature owns its own shared state (compare `CheckoutSection.tsx`).
7. `eslint.config.mjs` and `tsconfig.json` `strict` setting → confirm lint/type
   constraints before generating (no implicit `any`, etc).

### Step 2 — Confirm feature shape with what's inferable

From the user's request, determine:
- Route path under `src/app/` (kebab-case segment, e.g. `app/account/page.tsx`)
- Feature folder name under `src/components/features/<feature>/` (kebab-case)
- Does any component need `"use client"` (state, effects, event handlers,
  browser APIs)? Default to Server Component and only add the directive to
  the leaf components that actually need it — mirror how `CheckoutSection`
  stays a client component only because it owns `useState`, while
  `app/page.tsx` stays a Server Component that just passes props down.
- Does this feature call the Go/Gin backend? If yes, what's the route
  (`/v1/...`) and request/response shape — ask the user if not specified, or
  infer from an existing backend DTO if the backend code is in the same repo
  (`backend/internal/dto/*.go`).
- Does this feature need form validation? If yes, use `react-hook-form` +
  `zod`, matching `src/lib/payment/schema.ts`.

### Step 3 — Generate files in dependency order

Create in this order so each file only imports what already exists:

1. `src/types/<feature>.ts` — shared types/interfaces for this feature's data
   shapes. Keep request/response types separate from UI-only prop types.
2. `src/lib/api/<feature>.ts` — one exported async function per backend call,
   built on `apiFetch<T>()`. Never construct the base URL manually; never
   catch errors here — let `ApiError` propagate to the component layer.
3. `src/lib/<feature>/schema.ts` — Zod schema + inferred `type <X>FormValues`
   (only if the feature has a form). Reuse validator helpers from
   `src/lib/payment/validators.ts` if the same kind of input (card, postal
   code, etc.) is being validated again; don't duplicate logic.
4. `src/components/features/<feature>/<Feature>Section.tsx` — the feature's
   entry component. Server Component unless it needs client-only state itself.
   Owns any state shared across its children (compare `CheckoutSection`).
5. `src/components/features/<feature>/<SubComponent>.tsx` — one file per
   component, `PascalCase.tsx`, explicit `<ComponentName>Props` interface,
   `"use client"` only where actually needed.
6. `src/app/<route>/page.tsx` — wire the feature into a route. Default export
   required here (Next.js convention); keep it a thin Server Component that
   fetches/passes data and renders the feature's entry component (compare
   `src/app/page.tsx` + `mockOrder`).

See [REFERENCE.md](REFERENCE.md) for annotated code templates for every file
in this list.

### Step 4 — Verify

Run after generating:
```bash
npm run lint
npx tsc --noEmit
```
Fix any output before presenting the result. Do not run `npm run dev` or
`npm run build` as a blocking check — recommend the user run `npm run dev`
manually to visually confirm, since it's a long-running process.

## Key rules (do not deviate)

- Server Component by default. Add `"use client"` only to the components that
  need state, effects, event handlers, or browser-only APIs — push it as far
  down the tree as possible.
- One component per file, `PascalCase.tsx`, named export (except `page.tsx`/
  `layout.tsx`, which Next.js requires as default export).
- Every component's props get an explicit `interface <ComponentName>Props`.
- All backend calls go through `apiFetch<T>()` in `src/lib/api/client.ts` —
  never a bare `fetch`, never a hardcoded base URL, never a new envelope-parsing
  helper. Handle `ApiError` at the form/component boundary, not per call site.
- Reuse the existing `ApiResponse<T>` / `ApiError` shapes — don't invent a
  second error convention for a new feature.
- New TypeScript files only (`.ts`/`.tsx`), never `.js`/`.jsx`.
- Use the `@/*` path alias for all cross-folder imports.
- Tailwind utility classes, mobile-first (`sm:`/`md:`/`lg:` ascending). Extract
  a shared pattern into `components/ui/` instead of repeating class strings.
- Every interactive element needs an accessible name; use semantic HTML
  (`button`, `nav`, `main`, `header`) before `div` + `role`; every `<img>`
  needs `alt` (empty string if decorative).
- Don't add a new state library (Zustand, Context) or data-fetching library
  (React Query) unless the feature genuinely needs cross-component/global
  state or refetch/cache behavior that local `useState`/props can't cover —
  and check `package.json` first, since it may not be installed yet.
- Don't add tests unless the user asks, or sibling features already have
  tests — if they do, add matching tests for the new one (Vitest + React
  Testing Library per steering, once actually present in the project).

See [REFERENCE.md](REFERENCE.md) for full per-layer code templates.
