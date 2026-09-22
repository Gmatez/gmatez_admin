import { expect, test } from '@playwright/test';

test('unauthenticated dashboard redirects to login', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole('heading', { name: 'Operations sign in' })).toBeVisible();
});

test('admin login reaches the live dashboard when the API is up', async ({ page, request }) => {
  const health = await request.get('http://127.0.0.1:43121/health').catch(() => null);
  test.skip(!health?.ok(), 'Gmatez API is not running on port 43121');
  const email = process.env.E2E_ADMIN_EMAIL ?? 'admin@example.com';
  const password = process.env.E2E_ADMIN_PASSWORD ?? 'ChangeMe123!';
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole('heading', { name: 'Operations' })).toBeVisible();
});
