'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { Toaster } from 'sonner';
import { setUnauthorizedHandler } from '@/lib/auth/unauthorized';

export function Providers({ children }: { children: ReactNode }) {
  const router = useRouter();
  useEffect(() => {
    setUnauthorizedHandler(() => {
      router.replace('/login');
    });
  }, [router]);
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 15_000 },
          mutations: { retry: 0 },
        },
      }),
  );
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={client}>
        {children}
        <Toaster closeButton position="top-right" />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
