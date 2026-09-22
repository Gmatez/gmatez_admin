# Admin API contract

The admin web application calls the existing Gmatez API at `/api/v1`. The browser never calls that origin directly. Next.js route handlers hold the access and refresh tokens in HTTP-only cookies and proxy `/api/proxy/*`.

Authentication uses `POST /auth/login` and `POST /auth/refresh`. Only `role=ADMIN` and `status=ACTIVE` receive a session. The product phone-OTP flow is not an admin login.

## Read endpoints added for operations

These sit beside the original admin routes. Omitting `page` keeps the previous unpaginated list shape.

- `GET /admin/dashboard`
- `GET /admin/analytics?days=`
- `GET /admin/alerts`
- `GET /admin/search?q=`
- `GET /admin/system`
- `GET /admin/earnings`
- `GET /admin/wallets`
- `GET /admin/users?page=`
- `GET /admin/users/:id/ledger`
- `GET /admin/users/:id/blocks`
- `GET /admin/hosts?page=`
- `GET /admin/calls?page=`
- `GET /admin/calls/:id` now includes events, participants, settlement, and RTC channel. No RTC token.
- `GET /admin/payments?page=` and `GET /admin/payments/:id` omit `clientSecret`
- `GET /admin/payouts?page=` and `GET /admin/payouts/:id` return masked destination details
- `GET /admin/reports?page=` and `GET /admin/reports/:id`
- `GET /admin/notifications`
- `GET /admin/devices` returns a masked token
- `GET /admin/audit-logs?page=`

## Mutations already on the backend

- `PATCH /admin/users/:id/status`
- `PATCH /admin/hosts/:id/status`
- `PATCH /admin/hosts/:id/verification`
- `PATCH /admin/payouts/:id`
- `PATCH /admin/reports/:id`
- `POST /admin/wallet/adjustments` accepts an optional `idempotencyKey`
- `POST /admin/calls/:id/refund` is idempotent per call
- `GET /admin/users/:id/wallet/reconcile` is diagnostic
- `POST /admin/notifications` sends through the existing notification service and audits the send
- Banner routes under `/admin/banners`

Money fields are integer minor units. `CREATOR_SHARE_BPS` and the payout minimum are returned by the API. The payout rail status is `PAYOUT_PROVIDER_CONFIG_REQUIRED`.

Errors use:

```json
{ "error": { "code": "HOST_INCOMPLETE", "message": "...", "requestId": "..." } }
```
