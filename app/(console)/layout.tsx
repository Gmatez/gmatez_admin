import { Shell } from '@/components/layout/shell';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Suspense, type ReactNode } from 'react';

export const dynamic = 'force-dynamic';

export default async function ConsoleLayout({ children }: { children: ReactNode }) {
  const jar = await cookies();
  if (!jar.get('gmatez_at') && !jar.get('gmatez_rt')) {
    redirect('/login');
  }
  return (
    <Suspense>
      <Shell>{children}</Shell>
    </Suspense>
  );
}
