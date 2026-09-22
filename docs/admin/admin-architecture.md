# Admin architecture

`gmatez-admin` is a Next.js App Router application. Server state lives in TanStack Query. Forms use React Hook Form and Zod. The backend remains authoritative for authorization, host transitions, settlement, refunds, and payout rules.

## Request path

1. The operator signs in at `/login`.
2. `POST /api/auth/login` exchanges credentials with `POST /auth/login`, loads `GET /users/me`, and stores tokens in HTTP-only cookies.
3. Pages call `lib/api/client.ts`, which fetches `/api/proxy/...`.
4. The proxy attaches the bearer token, refreshes once on 401, and does not retry other failures.
5. Mutations set `retry: 0`. Financial retries are not automatic.

There is no admin Socket.IO room. Alerts and active calls poll.

The permission helper recognizes only `ADMIN`. It does not invent finance or support roles.

## Routes

`/dashboard`, `/users`, `/hosts`, `/calls`, `/payments`, `/payments/reconciliation`, `/wallet`, `/earnings`, `/payouts`, `/notifications`, `/reports`, `/audit-logs`, `/banners`, `/settings`, `/health`.
