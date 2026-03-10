# Docker Build — Root Causes & Fixes

## Overview

Migrating a Next.js 15 app to Docker revealed a class of issues caused by
**module-level code that runs at build time** and **missing env vars during
static generation**. This document captures each error, its root cause, and
the fix applied.

---

## Issue 1 — `new Resend(process.env.RESEND_API_KEY)` at module level

**Error**
```
Error: Missing API key. Pass it to the constructor `new Resend("re_123")`
Failed to collect page data for /api/auth/register-with-magic-link
```

**Root cause**  
`const resend = new Resend(process.env.RESEND_API_KEY)` was a module-level
constant. Next.js executes route modules during build-time page-data
collection; `RESEND_API_KEY` is not set in the build environment, so the
Resend SDK throws immediately on import.

**Fix**  
Move the instantiation inside the handler function body and add
`export const dynamic = 'force-dynamic'` to skip eager evaluation:

```ts
// Before
const resend = new Resend(process.env.RESEND_API_KEY);
export async function POST(request) { ... }

// After
export const dynamic = 'force-dynamic';
export async function POST(request) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  ...
}
```

**Files changed**
- `app/api/auth/register-with-magic-link/route.ts`
- `app/api/auth/register/route.ts`
- `app/api/auth/resend-verification/route.ts`

---

## Issue 2 — `CharacterBookmarkService` singleton calls `createClient()` at module level

**Error**
```
Error: @supabase/ssr: Your project's URL and API key are required to create a Supabase client!
Failed to collect page data for /api/test-db
```

**Root cause**  
`lib/features/storage/character-bookmark-service.ts` exports a module-level
singleton:
```ts
export const characterBookmarkService = new CharacterBookmarkService();
```
The constructor had `private supabase = createClient()` as a class field,
so `createBrowserClient(undefined, undefined)` was called the moment any
file imported from `@/lib/features/storage`.

**Fix**  
Convert the field to a lazy private getter — client is created only on first
method call:

```ts
// Before
class CharacterBookmarkService {
  private supabase = createClient();
}

// After
class CharacterBookmarkService {
  private _supabase: ReturnType<typeof createClient> | null = null;
  private get supabase() {
    if (!this._supabase) this._supabase = createClient();
    return this._supabase;
  }
}
```

**File changed**  
- `lib/features/storage/character-bookmark-service.ts`

---

## Issue 3 — All 39 remaining API routes missing `force-dynamic`

**Error**  
Various "Failed to collect page data" errors across different API routes as
the build progressed.

**Root cause**  
Next.js attempts to statically analyse every route. Without
`force-dynamic`, it tries to pre-render API routes and hits module-level
code or missing env vars.

**Fix**  
Added `export const dynamic = 'force-dynamic'` to all 39 API routes that
were missing it. This is also correct production behaviour — API routes
should never be statically cached.

---

## Issue 4 — TypeScript error in `scripts/sync-upstash-to-local.ts`

**Error**
```
Type error: Conversion of type 'ScanResultStandard' to type '[number, string[]]' may be a mistake
Type error: This comparison appears to be unintentional because types 'number' and 'string' have no overlap
```

**Root cause**  
The Upstash `scan()` return type is `ScanResultStandard`, not
`[number, string[]]`. Two issues:
1. Direct cast failed type overlap check
2. After casting `next` as `number`, comparing `cursor !== '0'` (string)
   was a type error

**Fix**
```ts
// Before
} as [number, string[]]
} while (cursor !== 0 && cursor !== '0');

// After
} as unknown as [number | string, string[]]
} while (Number(cursor) !== 0);
```

**File changed**  
- `scripts/sync-upstash-to-local.ts`

---

## Issue 5 — `useLanguage()` throws inside `/_not-found` during static generation

**Error**
```
Export encountered an error on /_not-found/page
Error: useLanguage must be used within a LanguageProvider
```

**Root cause**  
Next.js statically renders `/_not-found` using a minimal render tree that
does **not** include the `LanguageProvider` from `app/layout.tsx`. The
`useLanguage` hook threw unconditionally when its context was `undefined`.

**Fix**  
Return a safe fallback instead of throwing:

```ts
// Before
if (context === undefined) {
  throw new Error('useLanguage must be used within a LanguageProvider');
}

// After
if (context === undefined) {
  return {
    language: 'vi',
    setLanguage: (_lang: string) => {},
    t: (key: string) => key,
    translations: translations.vi,
  };
}
```

**Files changed**  
- `lib/language-context-new.tsx`
- `lib/language-context.tsx`

---

## Issue 6 — Dev-only `app/unit-test` pages crash static generation

**Error**
```
Export encountered an error on /unit-test/test-toast/page
```

**Root cause**  
`app/unit-test/` contains development/debug pages that are never needed in
production. Next.js tried to statically render them and hit context or env
issues.

**Fix**  
Exclude the directory from the Docker build context entirely:

```
# .dockerignore
app/unit-test
```

---

## Issue 7 — `NEXT_PUBLIC_SUPABASE_ANON_KEY` missing from `.env`

**Error**
```
Error: @supabase/ssr: Your project's URL and API key are required
Error occurred prerendering page "/auth/magic-link-sign-up"
```

**Root cause**  
`NEXT_PUBLIC_SUPABASE_ANON_KEY` was missing from `.env`. The Supabase
browser client (`createBrowserClient`) requires both URL and anon key at
build time for pages that call it during SSR/SSG.

**Fix**  
Added the missing key to `.env`.

---

## Issue 8 — Fragile `ARG` / `ENV` wiring in Dockerfile

**Root cause**  
The original Dockerfile used `ARG` + `ENV` to pass `NEXT_PUBLIC_*` vars to
the build stage, manually listing each one. This:
- Required updating Dockerfile + `docker-compose.yml` every time a new
  `NEXT_PUBLIC_*` var was added
- Did not cover server-side vars (they used placeholder strings)
- `.env` was excluded from the Docker build context by `.dockerignore`

**Fix**  
Source `.env` directly in the single `RUN` command that executes the build:

```dockerfile
# .dockerignore — removed .env exclusion

# Dockerfile builder stage
RUN set -a && . ./.env && set +a && yarn build
```

All vars (public and server-side) are available during the build. The `.env`
file only exists in the `builder` stage — it is never copied to the final
`runner` image (only `.next/standalone` is transferred).

---

## General Lessons

| Pattern | Problem | Fix |
|---|---|---|
| Module-level SDK instantiation | Runs at import time during build | Move inside handler / use lazy getter |
| `throw` in a context hook | Crashes Next.js special pages (`_not-found`) that render without providers | Return safe fallback |
| Dev-only pages in `app/` | Built and statically rendered even in production Docker images | Exclude via `.dockerignore` |
| Hard-coded `ARG` list for env vars | Breaks whenever a new var is added | Source `.env` directly in the build `RUN` |
| Missing `NEXT_PUBLIC_*` in `.env` | Pages that use the var during SSG crash the build | Keep `.env` complete and in sync with `.env.example` |
