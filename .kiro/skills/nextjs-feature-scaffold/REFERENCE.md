# REFERENCE — Next.js frontend feature templates

All templates below use `<Feature>` (PascalCase, e.g. `Profile`), `<feature>`
(kebab-case folder/route segment, e.g. `profile`), and `<Resource>` for a
backend-facing data shape (e.g. `User`). Replace before writing files. Field
names/types below are illustrative — always adapt them to what the user
actually asked for, and check whether an equivalent backend DTO already
exists under `backend/internal/dto/` before inventing field names.

## 1. `src/types/<feature>.ts`

```ts
/** Shape of a single <resource> as rendered by the <feature> UI. */
export interface <Resource>Data {
  id: string;
  // ...UI-facing fields...
}

/** Payload sent when creating/updating a <resource>. */
export interface Submit<Resource>Input {
  // ...request fields, matching backend dto naming...
}
```

Keep request/response types separate from any local-only UI state types
(e.g. a `"idle" | "loading" | "error"` union stays inline in the component,
not here).

## 2. `src/lib/api/<feature>.ts`

```ts
import { apiFetch } from "@/lib/api/client";
import type { <Resource>Data, Submit<Resource>Input } from "@/types/<feature>";

/**
 * Fetches <resource> data from the Go/Gin backend (GET /v1/<feature>/:id).
 */
export async function get<Resource>(id: string): Promise<<Resource>Data> {
  return apiFetch<<Resource>Data>(`/v1/<feature>/${encodeURIComponent(id)}`);
}

/**
 * Submits a new <resource> to the Go/Gin backend (POST /v1/<feature>).
 */
export async function submit<Resource>(input: Submit<Resource>Input): Promise<<Resource>Data> {
  return apiFetch<<Resource>Data>("/v1/<feature>", {
    method: "POST",
    body: input,
  });
}
```

Never build the URL with the raw base URL directly, and never `JSON.parse`/
`.json()` manually here — `apiFetch` already unwraps the NEO envelope and
throws `ApiError` on any non-success response.

## 3. `src/lib/<feature>/schema.ts` (only if the feature has a form)

```ts
import { z } from "zod";

export const <feature>Schema = z.object({
  // ...fields with inline error messages, matching src/lib/payment/schema.ts style...
  email: z.string().trim().min(1, "Email address is required.").email("Enter a valid email address."),
});

export type <Feature>FormValues = z.infer<typeof <feature>Schema>;
```

If validating a card number, expiry, CVV, or postal code again, import the
existing helpers from `src/lib/payment/validators.ts` instead of rewriting
Luhn/format logic.

## 4. `src/components/features/<feature>/<Feature>Section.tsx`

```tsx
import type { <Resource>Data } from "@/types/<feature>";

interface <Feature>SectionProps {
  data: <Resource>Data;
}

/**
 * Server Component entry point for the <feature> UI. Stays server-rendered
 * unless it needs to own client-only state itself — if so, add "use client"
 * here instead of pushing every child down to client components.
 */
export function <Feature>Section({ data }: <Feature>SectionProps) {
  return (
    <section aria-label="<Feature>" className="grid gap-5">
      {/* ...compose feature components... */}
    </section>
  );
}
```

If the feature needs shared client state across children (compare
`CheckoutSection`'s `discountRate`), add `"use client"` and `useState`/
`useMemo` here, and pass derived values down as props — don't duplicate the
same state in multiple child components.

## 5. `src/components/features/<feature>/<SubComponent>.tsx` (client, if needed)

```tsx
"use client";

import { useState } from "react";

import { ApiError } from "@/lib/api/client";
import { submit<Resource> } from "@/lib/api/<feature>";
import type { Submit<Resource>Input } from "@/types/<feature>";

interface <SubComponent>Props {
  // ...
}

export function <SubComponent>({ /* ... */ }: <SubComponent>Props) {
  const [state, setState] = useState<"idle" | "processing" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(input: Submit<Resource>Input) {
    setState("processing");
    setErrorMessage(null);
    try {
      await submit<Resource>(input);
      setState("idle");
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
      setState("error");
    }
  }

  return (
    // ...markup with accessible names, semantic HTML...
    <div />
  );
}
```

For a form component specifically, follow `CardPaymentForm.tsx`'s exact
pattern instead: `useForm` with `zodResolver(<feature>Schema)`, map backend
field errors from `ApiError.fields` back onto form fields via `setError`,
render `<FieldError>` under each input.

## 6. `src/app/<route>/page.tsx`

```tsx
import { <Feature>Section } from "@/components/features/<feature>/<Feature>Section";
import { get<Resource> } from "@/lib/api/<feature>";

// Server Component: fetch happens here, on the server, then data is passed
// down as props. Swap a mock data source for a real apiFetch call once the
// backend endpoint exists, same pattern as src/app/page.tsx + checkout-mock.ts.
export default async function <Feature>Page() {
  const data = await get<Resource>("placeholder-id");

  return (
    <div className="min-h-screen bg-zinc-100">
      <main className="mx-auto w-[min(1240px,calc(100%-32px))] py-7">
        <<Feature>Section data={data} />
      </main>
    </div>
  );
}
```

`page.tsx` and `layout.tsx` are the only files that use `default export` —
everything else in the feature uses named exports.

## Client vs Server Component decision

| Needs... | Component type |
|---|---|
| Just renders props, no interactivity | Server (default, no directive) |
| `useState`/`useReducer`/`useEffect` | Client (`"use client"`) |
| Event handlers (`onClick`, `onChange`, form `onSubmit`) | Client |
| Browser-only API (`window`, `localStorage`, etc.) | Client |
| Fetching data before render, no interactivity after | Server, `async` component |

Push `"use client"` as far down the component tree as possible — a page
that renders a client child does not itself need the directive.

## Error handling boundary

`ApiError` (from `src/lib/api/client.ts`) carries `status`, `code`, `message`,
and `fields` (field-level validation errors). Catch it in exactly one place
per feature — typically the form's submit handler or a shared error boundary
— and either:
- map `err.fields` onto matching form fields via `setError(...)`, or
- show `err.message` in a generic alert region (`role="alert"`).

Don't add a second try/catch per API call inside the same component tree.
