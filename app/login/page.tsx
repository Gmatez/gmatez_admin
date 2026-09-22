'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/fields';
import { safeNextPath } from '@/lib/auth/redirect';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(10, 'Password must be at least 10 characters'),
});

type FormValues = z.infer<typeof schema>;

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(values: FormValues) {
    setFormError(null);
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(values),
    });
    const body = (await response.json().catch(() => null)) as {
      error?: { message?: string; code?: string };
    } | null;
    if (!response.ok) {
      setFormError(body?.error?.message ?? 'Sign-in failed.');
      return;
    }
    router.replace(safeNextPath(params.get('next')));
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-950 px-4">
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-stone-900"
        noValidate
      >
        <p className="text-xs font-medium uppercase tracking-wide text-teal-800">Gmatez</p>
        <h1 className="mt-1 text-2xl font-semibold text-stone-950 dark:text-stone-50">
          Operations sign in
        </h1>
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
          Admin accounts use the existing email and password session. Phone OTP is the member app.
        </p>
        <div className="mt-5 space-y-3">
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="username" {...form.register('email')} />
            {form.formState.errors.email ? (
              <p className="text-sm text-red-700">{form.formState.errors.email.message}</p>
            ) : null}
          </div>
          <div className="space-y-1">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              {...form.register('password')}
            />
            {form.formState.errors.password ? (
              <p className="text-sm text-red-700">{form.formState.errors.password.message}</p>
            ) : null}
          </div>
        </div>
        {formError ? (
          <p role="alert" className="mt-4 text-sm text-red-700">
            {formError}
          </p>
        ) : null}
        <Button className="mt-5 w-full" type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
