# Admin testing

Frontend:

```
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
```

`npm test` covers money formatting, error mapping, redirect safety, the ADMIN permission gate, host transitions, status text, and the confirmation dialog.

Playwright always checks that `/dashboard` redirects to `/login`. The live login test calls `http://127.0.0.1:43121/health` and skips when the API is down. It uses `E2E_ADMIN_EMAIL` and `E2E_ADMIN_PASSWORD`, defaulting to the development seed `admin@example.com` / `ChangeMe123!`.

Backend unit coverage for the new query helpers:

```
npx jest src/modules/admin/admin-query.util.spec.ts --runInBand
```

Do not treat a production build as production verification.
