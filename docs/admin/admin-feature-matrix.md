# Admin feature matrix

| Feature | Backend | Admin UI | Tests | Status |
| --- | --- | --- | --- | --- |
| Admin login | POST /auth/login, refresh, users/me | Login, HTTP-only session | Unit redirect; Playwright redirect | IMPLEMENTED |
| Dashboard | GET /admin/dashboard, /admin/analytics | Counts and charts | Backend query helpers | IMPLEMENTED |
| Users | Paginated admin users | Table, detail, suspend, restore | Component confirm dialog | IMPLEMENTED |
| Hosts | Host list and detail | Filters including availability | Host transition unit test | IMPLEMENTED |
| Host approval | PATCH status with state machine | Confirm, notes, completeness | Transition unit test | IMPLEMENTED |
| Host verification | PATCH verification | Manual status buttons | — | IMPLEMENTED |
| Calls | Paginated calls | Table and filters | — | IMPLEMENTED |
| Call investigation | Call events and RTC channel | Timeline, no token | — | IMPLEMENTED |
| Payments | Paginated payments, detail without client secret | Table and detail | — | IMPLEMENTED |
| Wallet | Wallets, ledger, adjustment | List, detail, adjustment | Money unit tests | IMPLEMENTED |
| Refunds | POST refund, idempotent per call | Full refund confirm | — | IMPLEMENTED |
| Earnings | GET /admin/earnings, CREATOR_SHARE_BPS | Ledger figures | — | IMPLEMENTED |
| Payouts | List, detail, status patch | Masked destination, confirm | — | CONFIG_REQUIRED for the payout rail |
| Notifications | List, send, devices | Composer and masked tokens | — | IMPLEMENTED; delivery CONFIG_REQUIRED when FCM is mock |
| Reports | List, detail, status patch | Queue and actions | — | IMPLEMENTED |
| Audit logs | Paginated audit | Read-only table | — | IMPLEMENTED; failed attempts are a BACKEND_GAP |
| Health | GET /admin/system | Dependency status | — | IMPLEMENTED |
| Settings | GET /admin/system | Provider status without secrets | — | IMPLEMENTED |
| Realtime admin events | No admin socket | 30s alert poll, 10s active call poll | — | BACKEND_GAP |
| Admin call termination | No endpoint | Not shown | — | BACKEND_GAP |
| Granular RBAC | Role is ADMIN only | Permission map for ADMIN | Permission unit test | IMPLEMENTED for ADMIN only |
