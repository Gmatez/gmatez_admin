# Admin security

- Access and refresh tokens are HTTP-only, `SameSite=Lax`, and `Secure` outside development.
- `API_BASE_URL` is server-only. `NEXT_PUBLIC_*` does not carry secrets.
- Staging and production reject a localhost API base URL.
- The proxy refuses `..` path segments.
- Login `next` targets must be same-origin paths.
- Payment client secrets, webhook payloads, Agora certificates, RTC tokens, and full FCM tokens are not rendered.
- Payout destination strings are masked on the backend before they reach the browser.
- Audit logs are read-only in the UI.
- Wallet reconciliation does not write balances.
- Content-Security-Policy, `X-Frame-Options: DENY`, `nosniff`, referrer policy, and a locked permissions policy are set in `next.config.ts`.
- Production browser source maps are off.
- Frontend authorization only hides controls. The API still returns 403.

Known gap: failed admin attempts are not written to `AuditLog`, because the backend records the action after it succeeds. There is no admin realtime socket, so the panel does not join call or presence rooms.
