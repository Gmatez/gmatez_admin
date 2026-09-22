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
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data.callsPerDay}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tickFormatter={(value) => String(value).slice(5)} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="ended" stackId="a" fill="#0f766e" name="Ended" />
            <Bar dataKey="failed" stackId="a" fill="#b91c1c" name="Failed" />
            <Bar dataKey="cancelled" stackId="a" fill="#78716c" name="Cancelled" />
            <Bar dataKey="timeout" stackId="a" fill="#c2410c" name="Timeout" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Voice and video">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data.callsPerDay}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tickFormatter={(value) => String(value).slice(5)} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Line dataKey="voice" stroke="#0f766e" name="Voice" dot={false} />
            <Line dataKey="video" stroke="#1d4ed8" name="Video" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Registrations">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data.registrationsPerDay}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tickFormatter={(value) => String(value).slice(5)} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#44403c" name="New users" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Ledger amounts (major units, display only)">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={money}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis tickFormatter={(value) => (Number.isInteger(Number(value)) ? formatMoney(Number(value)) : '')} width={88} />
            <Tooltip formatter={(value) => (Number.isInteger(Number(value)) ? formatMoney(Number(value)) : '')} />
            <Legend />
            <Line dataKey="deposits" stroke="#0f766e" dot={false} name="Deposits" />
            <Line dataKey="charges" stroke="#1d4ed8" dot={false} name="Call charges" />
            <Line dataKey="earnings" stroke="#a16207" dot={false} name="Host earnings" />
            <Line dataKey="platform" stroke="#44403c" dot={false} name="Platform share" />
            <Line dataKey="refunds" stroke="#b91c1c" dot={false} name="Refunds" />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-3 dark:border-stone-800 dark:bg-stone-950">
      <h2 className="mb-2 text-sm font-semibold">{title}</h2>
      {children}
    </section>
  );
}
