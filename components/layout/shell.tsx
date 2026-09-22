'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  Banknote,
  Bell,
  Headset,
  LayoutDashboard,
  Menu,
  Moon,
  Phone,
  PieChart,
  ScrollText,
  Settings,
  Shield,
  Sun,
  Users,
  Wallet,
  ImageIcon,
  CreditCard,
  X,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useState, type ReactNode } from 'react';
import { apiGet } from '@/lib/api/client';
import type { AlertSummary, SearchResponse, SessionUser } from '@/types/admin';
import { useDebounced } from '@/hooks/use-url-filters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/fields';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/users', label: 'Users', icon: Users },
  { href: '/hosts', label: 'Hosts', icon: Headset },
  { href: '/calls', label: 'Calls', icon: Phone },
  { href: '/payments', label: 'Payments', icon: CreditCard },
  { href: '/wallet', label: 'Wallet', icon: Wallet },
  { href: '/earnings', label: 'Earnings', icon: PieChart },
  { href: '/payouts', label: 'Payouts', icon: Banknote },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/reports', label: 'Reports', icon: Shield },
  { href: '/audit-logs', label: 'Audit logs', icon: ScrollText },
  { href: '/banners', label: 'Banners', icon: ImageIcon },
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/health', label: 'Health', icon: Activity },
];

export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const debounced = useDebounced(search, 300);
  const me = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const response = await fetch('/api/auth/session', { credentials: 'same-origin' });
      if (response.status === 401) {
        router.replace('/login');
        throw new Error('Session ended');
      }
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body?.error?.message ?? 'Session failed');
      }
      return body.user as SessionUser;
    },
  });
  const alerts = useQuery({
    queryKey: ['alerts'],
    queryFn: () => apiGet<AlertSummary>('/admin/alerts'),
    refetchInterval: 30_000,
    enabled: me.data?.role === 'ADMIN',
  });
  const results = useQuery({
    queryKey: ['search', debounced],
    queryFn: () => apiGet<SearchResponse>('/admin/search', { q: debounced }),
    enabled: debounced.trim().length >= 2 && me.data?.role === 'ADMIN',
  });

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
    router.refresh();
  }

  const crumbs = pathname.split('/').filter(Boolean);

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 dark:bg-stone-950 dark:text-stone-100">
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 border-r border-stone-800 bg-stone-950 text-stone-100 transition-transform lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="/dashboard" className="font-semibold tracking-tight">
            Gmatez Ops
          </Link>
          <button className="lg:hidden" aria-label="Close navigation" onClick={() => setOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="space-y-1 px-2 pb-6" aria-label="Admin">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm ${active ? 'bg-teal-800 text-white' : 'text-stone-300 hover:bg-stone-900'}`}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className="h-4 w-4" aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      {open ? (
        <button
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          aria-label="Close menu overlay"
          onClick={() => setOpen(false)}
        />
      ) : null}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-stone-200 bg-white/95 px-4 backdrop-blur dark:border-stone-800 dark:bg-stone-950/95">
          <button className="lg:hidden" aria-label="Open navigation" onClick={() => setOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <div className="relative min-w-0 flex-1">
            <label className="sr-only" htmlFor="global-search">
              Search users, hosts, calls, payments, payouts, and reports
            </label>
            <Input
              id="global-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, phone, email, or id"
              className="h-9"
            />
            {debounced.trim().length >= 2 ? (
              <div className="absolute z-20 mt-1 max-h-80 w-full overflow-auto rounded-md border border-stone-200 bg-white p-2 text-sm shadow dark:border-stone-700 dark:bg-stone-950">
                <SearchResults data={results.data} loading={results.isFetching} />
              </div>
            ) : null}
          </div>
          <Link href="/hosts?status=PENDING_REVIEW&page=1" className="relative" aria-label="Operational alerts">
            <Bell className="h-5 w-5" />
            {alerts.data && alerts.data.total > 0 ? (
              <span className="absolute -right-2 -top-2 rounded-full bg-red-700 px-1.5 text-[10px] text-white">
                {alerts.data.total}
              </span>
            ) : null}
          </Link>
          <ThemeToggle />
          <div className="hidden text-right text-xs sm:block">
            <p className="font-medium">{me.data?.displayName ?? 'Admin'}</p>
            <p className="text-stone-500">{me.data?.role ?? ''}</p>
          </div>
          <Button variant="secondary" size="sm" onClick={logout}>
            Log out
          </Button>
        </header>
        <div className="px-4 py-3 text-xs text-stone-500">
          <nav aria-label="Breadcrumb">
            {crumbs.map((crumb, index) => (
              <span key={`${crumb}-${index}`}>
                {index > 0 ? ' / ' : ''}
                {crumb}
              </span>
            ))}
          </nav>
        </div>
        <main className="px-4 pb-10">{children}</main>
      </div>
    </div>
  );
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const dark = resolvedTheme === 'dark';
  return (
    <button
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={() => setTheme(dark ? 'light' : 'dark')}
      className="rounded-md p-2 hover:bg-stone-100 dark:hover:bg-stone-800"
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

function SearchResults({
  data,
  loading,
}: {
  data: SearchResponse | undefined;
  loading: boolean;
}) {
  if (loading && !data) return <p className="px-2 py-1 text-stone-500">Searching…</p>;
  if (!data) return null;
  const groups: Array<{ title: string; links: Array<{ href: string; label: string }> }> = [
    {
      title: 'Users',
      links: data.users.map((user) => ({
        href: `/users/${user.id}`,
        label: user.profile?.displayName ?? user.email,
      })),
    },
    {
      title: 'Hosts',
      links: data.hosts.map((host) => ({
        href: `/hosts/${host.userId}`,
        label: host.user.profile?.displayName ?? host.userId,
      })),
    },
    {
      title: 'Calls',
      links: data.calls.map((call) => ({ href: `/calls/${call.id}`, label: call.id })),
    },
    {
      title: 'Payments',
      links: data.payments.map((payment) => ({
        href: `/payments/${payment.id}`,
        label: payment.id,
      })),
    },
    {
      title: 'Payouts',
      links: data.payouts.map((payout) => ({ href: `/payouts/${payout.id}`, label: payout.id })),
    },
    {
      title: 'Reports',
      links: data.reports.map((report) => ({ href: `/reports/${report.id}`, label: report.id })),
    },
  ];
  const any = groups.some((group) => group.links.length > 0);
  if (!any) return <p className="px-2 py-1 text-stone-500">No matches.</p>;
  return (
    <div className="space-y-2">
      {groups.map((group) =>
        group.links.length === 0 ? null : (
          <div key={group.title}>
            <p className="px-2 text-xs uppercase text-stone-500">{group.title}</p>
            {group.links.map((link) => (
              <Link key={link.href} href={link.href} className="block truncate rounded px-2 py-1 hover:bg-stone-100 dark:hover:bg-stone-900">
                {link.label}
              </Link>
            ))}
          </div>
        ),
      )}
    </div>
  );
}
