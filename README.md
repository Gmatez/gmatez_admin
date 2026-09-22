# Gmatez Admin

Operations console for the Gmatez API. It does not ship mock users, payments, or payouts.

## Develop

```
npm install
copy .env.example .env.local
npm run dev
```

The API defaults to `http://127.0.0.1:43121/api/v1`. Sign in with an `ADMIN` user. The development seed is `admin@example.com` / `ChangeMe123!` after `npm run prisma:seed` in `gmatez_backend`.

The backend `CORS_ORIGINS` does not need the admin origin, because the browser talks only to this Next.js app.

## Check

```
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
npm start
```

Staging and production require `APP_ENV` and `API_BASE_URL`. A localhost API is rejected in those environments.
