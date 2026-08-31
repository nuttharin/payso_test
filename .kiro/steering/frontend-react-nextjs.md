---
inclusion: always
---

# Frontend Standards: React + Next.js

## Stack
- Framework: Next.js (App Router, `app/` directory)
- Language: TypeScript (strict mode) — ห้ามใช้ `.js`/`.jsx` สำหรับไฟล์ใหม่
- Styling: Tailwind CSS (ถ้าโปรเจกต์ยังไม่มี ให้ตั้งค่าตาม Tailwind + Next.js official guide)
- Package manager: pnpm (ถ้าไม่มี lockfile อื่นอยู่แล้ว)
- Data fetching: ใช้ Next.js native fetch + Server Components เป็นหลัก, ใช้ `@tanstack/react-query` สำหรับ client-side state ที่ต้อง refetch/cache
- Form: `react-hook-form` + `zod` สำหรับ validation

## Project Structure
```
src/
  app/                    # routes (App Router)
    (marketing)/          # route groups ถ้าจำเป็น
    api/                  # Next.js API routes (ใช้เฉพาะ BFF/proxy เท่านั้น ไม่ใช่ business logic)
    layout.tsx
    page.tsx
  components/
    ui/                   # reusable, presentational components (button, input, modal)
    features/<feature>/    # feature-specific components
  lib/
    api/                  # API client functions (เรียก Go/Gin backend)
    hooks/                # custom hooks
    utils/                # pure helper functions
  types/                  # shared TypeScript types/interfaces
  styles/                 # global css
```

## Component Conventions
- Component ใหม่เป็น **Server Component โดย default** ใส่ `"use client"` เฉพาะตอนที่ต้องใช้ state, effect, event handler, หรือ browser-only API
- ชื่อไฟล์ component: `PascalCase.tsx` เช่น `UserCard.tsx`
- ชื่อ hook: `useCamelCase.ts` เช่น `useAuth.ts`
- 1 component ต่อ 1 ไฟล์ ยกเว้น sub-component เล็กๆที่ใช้ภายในไฟล์เดียวกันเท่านั้น
- Props ต้องมี explicit TypeScript interface/type ชื่อ `<ComponentName>Props`

## API Integration (เชื่อมกับ Go + Gin backend)
- รวม base URL และ config ไว้ที่ `lib/api/client.ts` เดียว (ใช้ `fetch` wrapper หรือ `axios` instance) — ห้าม hardcode URL กระจายในหลายไฟล์
- Backend response format คือ NEO-style envelope (ดู steering ฝั่ง backend) เช่น:
  ```json
  { "status": "success", "data": {}, "message": "" }
  ```
  ฝั่ง frontend ต้องมี generic type `ApiResponse<T>` ที่ map กับ format นี้ และ helper สำหรับ unwrap/handle error แบบเดียวกันทุกที่
- ใช้ environment variable `NEXT_PUBLIC_API_BASE_URL` สำหรับ base URL ของ backend (กำหนดใน `.env.local`, ห้าม commit `.env.local`)
- Error handling: throw custom `ApiError` class ที่มี `status`, `code`, `message` แล้ว catch ที่ layer เดียว (เช่น react-query's `onError` หรือ error boundary) ไม่ใช่ try/catch กระจายทุก component

## State Management
- Local UI state: `useState`/`useReducer`
- Server data / cache: React Query
- Global client state (เช่น auth session, theme): React Context หรือ Zustand ถ้า Context ไม่พอ — อย่าเพิ่ม state library ใหม่โดยไม่จำเป็น

## Styling
- ใช้ Tailwind utility classes เป็นหลัก, หลีกเลี่ยง inline style และ CSS module ถ้าไม่จำเป็น
- Responsive: mobile-first (`sm:`, `md:`, `lg:` ไล่ขึ้น)
- Reusable style patterns → ทำเป็น component ใน `components/ui`, ไม่ copy class string ซ้ำๆ

## Accessibility & Quality
- ทุก interactive element ต้องมี accessible name (`aria-label` ถ้าไม่มี visible text)
- ใช้ semantic HTML (`button`, `nav`, `main`, `header`) ก่อนใช้ `div` + role
- รูปภาพต้องมี `alt` เสมอ (ใช้ `""` ถ้าเป็น decorative)
- Lint ต้องผ่านก่อน commit: `next lint` (ESLint) และ `tsc --noEmit`

## Testing
- Unit/component test: Vitest + React Testing Library
- E2E (ถ้าต้องการ): Playwright
- ไม่ต้องเขียนเทสถ้า user ไม่ได้ขอ แต่ถ้ามี test infra อยู่แล้วในโปรเจกต์ ให้เขียน test คู่กับ feature ใหม่เสมอ

## Naming & Code Style
- ตัวแปร/ฟังก์ชัน: `camelCase`
- Type/Interface/Component: `PascalCase`
- Constant ที่ fix ค่า: `UPPER_SNAKE_CASE`
- ใช้ named export เป็นหลัก ยกเว้น `page.tsx`, `layout.tsx` ที่ Next.js บังคับ default export
