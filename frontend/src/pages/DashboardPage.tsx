import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { apiClient } from '../api/client';
import { Card } from '../components/ui/Card';
import { RejectionValueVsQuantityChart } from '../components/charts/RejectionValueVsQuantityChart';
import { ChannelDistributionPie } from '../components/charts/ChannelDistributionPie';
import { StatusBadge } from '../components/ui/StatusBadge';

type TicketStatus = 'pending' | 'approved' | 'rejected';

interface Ticket {
  id: string;
  product_name: string;
  quantity: number;
  cost: number;
  channel: 'B2B' | 'B2C';
  status: TicketStatus;
  delivery_batch: string;
  delivery_date: string;
  created_at: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get<{ items: Ticket[]; total: number }>('/tickets', {
          params: { limit: 200 },
        });
        setTickets(res.data.items);
      } catch (err: unknown) {
        // If unauthorized, just show empty state instead of spamming errors.
        // Other errors also degrade gracefully to an empty dashboard.
        setTickets([]);
        // eslint-disable-next-line no-console
        console.warn('Dashboard tickets load failed', err);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const { totalTickets, totalB2B, totalB2C, pendingCount, chartData, pieData, recent } =
    useMemo(() => {
      const total = tickets.length;
      let b2bValue = 0;
      let b2cValue = 0;
      let pending = 0;
      let qtyB2B = 0;
      let qtyB2C = 0;

      tickets.forEach((t) => {
        if (t.channel === 'B2B') {
          b2bValue += Number(t.cost || 0);
          qtyB2B += Number(t.quantity || 0);
        } else if (t.channel === 'B2C') {
          b2cValue += Number(t.cost || 0);
          qtyB2C += Number(t.quantity || 0);
        }
        if (t.status === 'pending') pending += 1;
      });

      const formatter = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      });

      const chart = [
        {
          channel: 'B2B',
          value: b2bValue,
          quantity: qtyB2B,
        },
        {
          channel: 'B2C',
          value: b2cValue,
          quantity: qtyB2C,
        },
      ];

      const pie = [
        { channel: 'B2B', value: b2bValue },
        { channel: 'B2C', value: b2cValue },
      ];

      const recentTickets = [...tickets]
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )
        .slice(0, 5);

      return {
        totalTickets: total,
        totalB2B: b2bValue ? formatter.format(b2bValue) : '–',
        totalB2C: b2cValue ? formatter.format(b2cValue) : '–',
        pendingCount: pending,
        chartData: chart,
        pieData: pie,
        recent: recentTickets,
      };
    }, [tickets]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">
            Dashboard
          </h2>
          <p className="text-sm text-gray-500">
            Rejection overview for {user?.role} across B2B and B2C.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs text-emerald-700">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Live rejection tracking
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <Card
          title="Total tickets"
          subtitle="All B2B & B2C rejection tickets"
          className="border-t-4 border-t-amber-400"
        >
          <div className="text-2xl font-semibold text-gray-900">
            {loading ? '…' : totalTickets || '0'}
          </div>
          <p className="mt-1 text-[11px] text-emerald-700">
            {totalTickets ? `${totalTickets} tickets in the system` : 'No tickets yet'}
          </p>
        </Card>
        <Card
          title="B2B rejection value"
          subtitle="Across all B2B customers"
          className="border-t-4 border-t-sky-400"
        >
          <div className="text-2xl font-semibold text-gray-900">
            {loading ? '…' : totalB2B}
          </div>
          <p className="mt-1 text-[11px] text-gray-500">Updated from latest tickets</p>
        </Card>
        <Card
          title="B2C rejection value"
          subtitle="Across all B2C orders"
          className="border-t-4 border-t-rose-400"
        >
          <div className="text-2xl font-semibold text-gray-900">
            {loading ? '…' : totalB2C}
          </div>
          <p className="mt-1 text-[11px] text-gray-500">Retail / D2C channel losses</p>
        </Card>
        <Card
          title="Pending approvals"
          subtitle="Waiting for manager / admin"
          className="border-t-4 border-t-emerald-400"
        >
          <div className="text-2xl font-semibold text-gray-900">
            {loading ? '…' : pendingCount || '0'}
          </div>
          <p className="mt-1 text-[11px] text-gray-500">
            Use Approvals tab to action these.
          </p>
        </Card>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card
          title="Revenue loss vs quantity"
          subtitle="Current delivery window by channel"
          rightSlot={
            <button className="rounded-full border border-gray-200 px-3 py-1 text-[11px] text-gray-600 bg-gray-50">
              This week
            </button>
          }
          className="xl:col-span-2 h-72"
        >
          {chartData ? (
            <RejectionValueVsQuantityChart data={chartData} />
          ) : (
            <div className="card-placeholder text-[11px] text-gray-500">
              No data yet.
            </div>
          )}
        </Card>
        <Card
          title="Channel distribution"
          subtitle="Share of total rejection value"
          className="h-72"
        >
          <ChannelDistributionPie data={pieData} />
        </Card>
      </div>

      {/* Recent tickets table */}
      <Card
        title="Recent tickets"
        subtitle="Latest rejection tickets across B2B and B2C"
      >
        {loading ? (
          <div className="text-sm text-gray-500">Loading tickets…</div>
        ) : recent.length === 0 ? (
          <div className="text-sm text-gray-500">No tickets yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-2 text-left">Ticket ID</th>
                  <th className="px-4 py-2 text-left">Product</th>
                  <th className="px-4 py-2 text-left">Qty</th>
                  <th className="px-4 py-2 text-left">Cost</th>
                  <th className="px-4 py-2 text-left">Channel</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recent.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-mono text-xs text-gray-600">
                      {t.id.slice(0, 8)}
                    </td>
                    <td className="px-4 py-2">{t.product_name}</td>
                    <td className="px-4 py-2">{t.quantity}</td>
                    <td className="px-4 py-2">
                      {Number(t.cost || 0).toLocaleString('en-IN', {
                        style: 'currency',
                        currency: 'INR',
                        maximumFractionDigits: 0,
                      })}
                    </td>
                    <td className="px-4 py-2 text-xs">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          t.channel === 'B2B'
                            ? 'bg-sky-50 text-sky-700'
                            : 'bg-orange-50 text-orange-700'
                        }`}
                      >
                        {t.channel}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="px-4 py-2 text-xs text-gray-500">
                      {new Date(t.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

