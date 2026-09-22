import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const jar = await cookies();
  redirect(jar.get('gmatez_at') || jar.get('gmatez_rt') ? '/dashboard' : '/login');
}
