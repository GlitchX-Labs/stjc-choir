# STJC Song Tracker

Song planning for Saint Teresa's Junior Choir, Nungambakkam. Next.js 14 (App Router), Tailwind, Supabase, Gemini.

## Run

```
npm install
# .env.local: SUPABASE_URL, SUPABASE_ANON_KEY, GEMINI_API_KEY, GEMINI_MODEL, SESSION_SECRET
npm run dev
```

Set the same variables on Vercel. `GEMINI_API_KEY` is only read inside `app/api/recommend/route.ts`.

## AI page setup

Run `sql/recommendations.sql` once in the Supabase SQL editor. The AI page works without it, but sessions are not saved.

## Roles

Enforced on the server (`lib/auth.ts`, used by every page and server action):

| Role | Can |
|---|---|
| admin | everything, plus Admin, library tagging, AI |
| choir_master | edit songs, AI |
| senior_member | edit songs |
| member | read only |

## Check

`npx tsx lib/transpose.test.ts` for the key transposition.
