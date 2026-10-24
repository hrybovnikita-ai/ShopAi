import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Package,
  ReceiptText,
  Users,
  DollarSign,
  RefreshCw,
  AlertTriangle,
  ShoppingBag,
  Tags,
  TrendingUp,
} from "lucide-react";
import { apiRequest } from "@/lib/api";
import type { AdminStats } from "@/types/admin";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { BarList } from "@/components/admin/charts";
import { Badge, EmptyState, PageHeader, Skeleton, StatCard } from "@/components/admin/ui";
import { useToast } from "@/components/Toast";

export function AdminOverview() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { push } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setStats(await apiRequest<AdminStats>("/admin/stats"));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const refresh = async () => {
    await load();
    push("Dashboard refreshed");
  };

  return (
    <div>
      <PageHeader
        title="Overview"
        description="Live figures from the ShopAi PostgreSQL database."
        actions={
          <button type="button" onClick={refresh} className="btn-secondary !py-2.5 text-sm" disabled={loading}>
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        }
      />

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {loading && !stats ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, index) => (
            <Skeleton key={index} className="h-28" />
          ))}
        </div>
      ) : stats ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Products"
              value={stats.products}
              hint={`${stats.activeProducts} active · ${stats.categories} categories`}
              icon={Package}
              accent="violet"
            />
            <StatCard
              label="Orders"
              value={stats.orders}
              hint={`${stats.pendingOrders} pending`}
              icon={ReceiptText}
              accent="blue"
            />
            <StatCard
              label="Revenue"
              value={formatCurrency(stats.revenue)}
              hint={`Avg order ${formatCurrency(stats.avgOrderValue)}`}
              icon={DollarSign}
              accent="emerald"
            />
            <StatCard
              label="Customers"
              value={stats.customers}
              hint="Registered accounts"
              icon={Users}
              accent="amber"
            />
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <StatCard label="Low stock" value={stats.lowStock} hint="5 units or fewer" icon={AlertTriangle} accent="amber" />
            <StatCard label="Out of stock" value={stats.outOfStock} hint="Unavailable for purchase" icon={ShoppingBag} accent="violet" />
            <StatCard label="Categories" value={stats.categories} hint="Managed catalog groups" icon={Tags} accent="blue" />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <section className="glass-dark p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold text-white">Recent orders</h2>
                <Link to="/admin/orders" className="text-xs text-violet-300 hover:text-violet-200">
                  View all
                </Link>
              </div>
              {stats.recentOrders.length === 0 ? (
                <EmptyState
                  icon={ReceiptText}
                  title="No orders yet"
                  description="Orders placed through the checkout will appear here."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="text-xs uppercase tracking-wide text-gray-500">
                        <th className="pb-2 font-medium">Customer</th>
                        <th className="pb-2 font-medium">Status</th>
                        <th className="pb-2 text-right font-medium">Total</th>
                        <th className="pb-2 text-right font-medium">Placed</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {stats.recentOrders.map((order) => (
                        <tr key={order.id}>
                          <td className="py-2.5">
                            <p className="text-gray-200">{order.customer_name}</p>
                            <p className="text-xs text-gray-500">{order.customer_email}</p>
                          </td>
                          <td className="py-2.5">
                            <Badge tone={order.status === "cancelled" ? "danger" : order.status === "pending" ? "warning" : "success"}>
                              {order.status}
                            </Badge>
                          </td>
                          <td className="py-2.5 text-right text-gray-200">{formatCurrency(order.total)}</td>
                          <td className="py-2.5 text-right text-xs text-gray-500">{formatDateTime(order.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="glass-dark p-5">
              <div className="mb-4 flex items-center gap-2">
                <TrendingUp size={16} className="text-violet-300" />
                <h2 className="font-display text-lg font-semibold text-white">Top products by revenue</h2>
              </div>
              <BarList
                items={stats.topProducts.map((product) => ({
                  label: product.name,
                  value: Math.round(product.revenue),
                  caption: `${product.units} sold`,
                }))}
                emptyLabel="No sales recorded yet"
                tone="emerald"
              />
            </section>
          </div>

          <section className="glass-dark mt-6 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-white">Inventory alerts</h2>
              <Link to="/admin/products?availability=low" className="text-xs text-violet-300 hover:text-violet-200">
                Manage inventory
              </Link>
            </div>
            {stats.lowStockProducts.length === 0 ? (
              <p className="py-4 text-sm text-gray-500">Every product has healthy stock.</p>
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2">
                {stats.lowStockProducts.map((product) => (
                  <li key={product.id} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-sm">
                    <span className="truncate text-gray-200">{product.name}</span>
                    <Badge tone={product.stock === 0 ? "danger" : "warning"}>{product.stock} left</Badge>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
