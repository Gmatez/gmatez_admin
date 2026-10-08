'use client';

import type { ReactNode } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { AnalyticsResponse } from '@/types/admin';
import { formatMoney } from '@/lib/money';

const grid = { stroke: '#e2e8f0', strokeDasharray: '3 3' };
const tick = { fill: '#64748b', fontSize: 12 };

export function OpsCharts({ data }: { data: AnalyticsResponse }) {
  const money = data.moneyPerDay.map((row) => ({
    date: row.date.slice(5),
    deposits: row.depositsCents,
    charges: row.callChargesCents,
    earnings: row.creatorEarningsCents,
    refunds: row.refundsCents,
    platform: row.platformShareCents,
  }));
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <ChartCard title="Calls per day">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data.callsPerDay}>
            <CartesianGrid {...grid} vertical={false} />
            <XAxis dataKey="date" tickFormatter={(value) => String(value).slice(5)} tick={tick} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={tick} axisLine={false} tickLine={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="ended" stackId="a" fill="#2563eb" name="Ended" radius={[0, 0, 0, 0]} />
            <Bar dataKey="failed" stackId="a" fill="#ef4444" name="Failed" />
            <Bar dataKey="cancelled" stackId="a" fill="#94a3b8" name="Cancelled" />
            <Bar dataKey="timeout" stackId="a" fill="#f59e0b" name="Timeout" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Voice and video">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data.callsPerDay}>
            <CartesianGrid {...grid} vertical={false} />
            <XAxis dataKey="date" tickFormatter={(value) => String(value).slice(5)} tick={tick} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={tick} axisLine={false} tickLine={false} />
            <Tooltip />
            <Legend />
            <Line dataKey="voice" stroke="#3d4fff" name="Voice" dot={false} strokeWidth={2.5} />
            <Line dataKey="video" stroke="#38bdf8" name="Video" dot={false} strokeWidth={2.5} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Registrations">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data.registrationsPerDay}>
            <CartesianGrid {...grid} vertical={false} />
            <XAxis dataKey="date" tickFormatter={(value) => String(value).slice(5)} tick={tick} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={tick} axisLine={false} tickLine={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#2563eb" name="New users" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Money movement">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={money}>
            <CartesianGrid {...grid} vertical={false} />
            <XAxis dataKey="date" tick={tick} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={(value) => (Number.isInteger(Number(value)) ? formatMoney(Number(value)) : '')} width={88} tick={tick} axisLine={false} tickLine={false} />
            <Tooltip formatter={(value) => (Number.isInteger(Number(value)) ? formatMoney(Number(value)) : '')} />
            <Legend />
            <Line dataKey="deposits" stroke="#3d4fff" dot={false} strokeWidth={2} name="Deposits" />
            <Line dataKey="charges" stroke="#0ea5e9" dot={false} strokeWidth={2} name="Call charges" />
            <Line dataKey="earnings" stroke="#10b981" dot={false} strokeWidth={2} name="Host earnings" />
            <Line dataKey="platform" stroke="#6366f1" dot={false} strokeWidth={2} name="Platform share" />
            <Line dataKey="refunds" stroke="#ef4444" dot={false} strokeWidth={2} name="Refunds" />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <h2 className="mb-3 text-base font-semibold text-slate-900 dark:text-slate-50">{title}</h2>
      {children}
    </section>
  );
}
