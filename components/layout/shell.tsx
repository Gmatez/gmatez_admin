'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  BadgeDollarSign,
  Banknote,
  Bell,
  CreditCard,
  Headset,
  ImageIcon,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  PanelLeft,
  Phone,
  PieChart,
  ScrollText,
  Search,
  Settings,
  SlidersHorizontal,
  Shield,
  Sun,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useState, type ReactNode } from 'react';
import { apiGet } from '@/lib/api/client';
import type { AlertSummary, SearchResponse, SessionUser } from '@/types/admin';
import { useDebounced } from '@/hooks/use-url-filters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/fields';

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
};

const GROUPS: Array<{ label: string | null; items: NavItem[] }> = [
  { label: null, items: [{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }] },
  {
    label: 'Platform',
    items: [
      { href: '/users', label: 'Users', icon: Users },
      { href: '/hosts', label: 'Hosts', icon: Headset },
      { href: '/calls', label: 'Calls', icon: Phone },
    ],
  },
  {
    label: 'Finance',
    items: [
      { href: '/payments', label: 'Payments', icon: CreditCard },
      { href: '/wallet', label: 'Wallet', icon: Wallet },
      { href: '/earnings', label: 'Earnings', icon: PieChart },
      { href: '/payouts', label: 'Payouts', icon: Banknote },
      { href: '/pricing', label: 'Call pricing', icon: SlidersHorizontal },
      { href: '/recharge-plans', label: 'Recharge plans', icon: BadgeDollarSign },
    ],
  },
  {
    label: 'Communication',
    items: [
      { href: '/notifications', label: 'Notifications', icon: Bell },
      { href: '/reports', label: 'Reports', icon: Shield },
      { href: '/banners', label: 'Banners', icon: ImageIcon },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/audit-logs', label: 'Audit Logs', icon: ScrollText },
      { href: '/settings', label: 'Settings', icon: Settings },
      { href: '/health', label: 'Health', icon: Activity },
    ],
  },
];

function alertCount(href: string, alerts: AlertSummary | undefined) {
  if (!alerts) return 0;
  if (href === '/hosts') return alerts.pendingHostApplications;
  if (href === '/reports') return alerts.openReports;
  if (href === '/payouts') return alerts.payoutRequests;
  if (href === '/notifications') return alerts.failedNotifications24h;
  if (href === '/payments') return alerts.failedPayments24h;
  return 0;
}

export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
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
  const displayName = me.data?.displayName ?? 'Admin';
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'A';

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 dark:bg-[#0B1220] dark:text-slate-100">
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex flex-col bg-gradient-to-b from-brand-600 to-brand-800 text-white shadow-xl transition-[width,transform] duration-200 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'} ${collapsed ? 'w-64 lg:w-[84px]' : 'w-64'}`}
      >
        <div className={`flex items-center gap-3 px-3 py-4 ${collapsed ? 'lg:justify-center lg:px-2' : ''}`}>
          <Link href="/dashboard" className="min-w-0 flex-1" onClick={() => setOpen(false)}>
            <img
              src="/gmatez-logo.jpg"
              alt="Gmatez"
              className={`w-full rounded-xl bg-white object-contain ${collapsed ? 'h-10 lg:h-10' : 'h-16'}`}
            />
          </Link>
          <button className="ml-auto lg:hidden" aria-label="Close navigation" onClick={() => setOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="sidebar-nav flex-1 space-y-4 px-3 pb-4" aria-label="Admin">
          {GROUPS.map((group) => (
            <div key={group.label ?? 'home'} className="space-y-1">
              {group.label ? (
                <p className={`px-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-100/80 ${collapsed ? 'lg:sr-only' : ''}`}>
                  {group.label}
                </p>
              ) : null}
              {group.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                const count = alertCount(item.href, alerts.data);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={item.label}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${collapsed ? 'lg:justify-center lg:px-0' : ''} ${active ? 'bg-white text-brand-700 shadow-sm' : 'text-white/90 hover:bg-white/10'}`}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
                    <span className={collapsed ? 'lg:sr-only' : ''}>{item.label}</span>
                    {count > 0 ? (
                      <span
                        className={`ml-auto inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-semibold ${active ? 'bg-brand-100 text-brand-700' : 'bg-white/20 text-white'} ${collapsed ? 'lg:hidden' : ''}`}
                      >
                        {count}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="border-t border-white/15 p-3">
          <button
            type="button"
            className="hidden w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm text-brand-50 hover:bg-white/10 lg:flex"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={() => setCollapsed((value) => !value)}
          >
            <PanelLeft className="h-4 w-4" />
            <span className={collapsed ? 'sr-only' : ''}>{collapsed ? 'Expand' : 'Collapse'}</span>
          </button>
        </div>
      </aside>
      {open ? (
        <button
          className="fixed inset-0 z-20 bg-slate-900/40 lg:hidden"
          aria-label="Close menu overlay"
          onClick={() => setOpen(false)}
        />
      ) : null}
      <div className={collapsed ? 'lg:pl-[84px]' : 'lg:pl-64'}>
        <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 md:px-6">
          <button className="rounded-lg p-2 hover:bg-slate-100 lg:hidden" aria-label="Open navigation" onClick={() => setOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <div className="relative min-w-0 flex-1">
            <label className="sr-only" htmlFor="global-search">
              Search users, hosts, calls, payments, payouts, and reports
            </label>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <Input
              id="global-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search users, hosts, calls, payments..."
              className="h-10 rounded-full border-transparent bg-brand-50 pl-9 focus:border-brand-600 focus:bg-white dark:border-slate-700 dark:bg-slate-900"
            />
            {debounced.trim().length >= 2 ? (
              <div className="absolute z-20 mt-2 max-h-80 w-full overflow-auto rounded-2xl border border-slate-200 bg-white p-2 text-sm shadow-lg dark:border-slate-700 dark:bg-slate-950">
                <SearchResults data={results.data} loading={results.isFetching} />
              </div>
            ) : null}
          </div>
          <Link
            href="/hosts?status=PENDING_REVIEW&page=1"
            className="relative rounded-full p-2 text-slate-600 hover:bg-brand-50 dark:text-slate-200 dark:hover:bg-slate-800"
            aria-label="Operational alerts"
          >
            <Bell className="h-5 w-5" />
            {alerts.data && alerts.data.total > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 rounded-full bg-red-500 px-1.5 text-[10px] font-semibold text-white">
                {alerts.data.total}
              </span>
            ) : null}
          </Link>
          <ThemeToggle />
          <details className="relative">
            <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-slate-50 dark:hover:bg-slate-900 [&::-webkit-details-marker]:hidden">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-600 text-xs font-semibold text-white">
                {initials}
              </span>
              <span className="hidden text-left sm:block">
                <span className="block text-sm font-semibold leading-tight text-slate-900 dark:text-slate-50">
                  {displayName}
                </span>
                <span className="block text-xs text-slate-500">{me.data?.role ?? ''}</span>
              </span>
            </summary>
            <div className="absolute right-0 z-20 mt-2 w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg dark:border-slate-700 dark:bg-slate-950">
              <Button variant="ghost" className="w-full justify-start" onClick={logout}>
                <LogOut className="h-4 w-4" />
                Log out
              </Button>
            </div>
          </details>
        </header>
        <div className="px-4 py-3 text-xs font-medium text-slate-400 md:px-6">
          <nav aria-label="Breadcrumb">
            {crumbs.map((crumb, index) => (
              <span key={`${crumb}-${index}`}>
                {index > 0 ? ' / ' : ''}
                {crumb}
              </span>
            ))}
          </nav>
        </div>
        <main className="px-4 pb-10 md:px-6">{children}</main>
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
      className="rounded-full p-2 text-slate-600 hover:bg-brand-50 dark:text-slate-200 dark:hover:bg-slate-800"
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
  if (loading && !data) return <p className="px-2 py-1 text-slate-500">Searching…</p>;
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
  if (!any) return <p className="px-2 py-1 text-slate-500">No matches.</p>;
  return (
    <div className="space-y-2">
      {groups.map((group) =>
        group.links.length === 0 ? null : (
          <div key={group.title}>
            <p className="px-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{group.title}</p>
            {group.links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block truncate rounded-lg px-2 py-1.5 hover:bg-brand-50 dark:hover:bg-slate-900"
              >
                {link.label}
              </Link>
            ))}
          </div>
        ),
      )}
    </div>
  );
}
