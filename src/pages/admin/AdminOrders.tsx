import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, RefreshCw, Search, ReceiptText, Eye } from "lucide-react";
import { apiRequest } from "@/lib/api";
import type { AdminOrder, OrderStatus, Paginated } from "@/types/admin";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { Badge, EmptyState, Modal, PageHeader, Pagination, Skeleton } from "@/components/admin/ui";
import { useToast } from "@/components/Toast";

const STATUSES: OrderStatus[] = ["pending", "paid", "shipped", "delivered", "cancelled"];

function statusTone(status: OrderStatus) {
  if (status === "cancelled") return "danger" as const;
  if (status === "pending") return "warning" as const;
  if (status === "delivered") return "success" as const;
  return "violet" as const;
}

export function AdminOrders() {
  const [status, setStatus] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Paginated<AdminOrder> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminOrder | null>(null);
  const { push } = useToast();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const load = useCallback(async (signal?: AbortSignal) => {
    const params = new URLSearchParams({ page: String(page), pageSize: "10" });
    if (status) params.set("status", status);
    if (search) params.set("search", search);

    setLoading(true);
    try {
      const result = await apiRequest<Paginated<AdminOrder>>(`/admin/orders?${params.toString()}`, { signal });
      setData(result);
      setError(null);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Could not load orders");
    } finally {
      setLoading(false);
    }
  }, [page, status, search]);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load, reloadKey]);

  const updateStatus = async (order: AdminOrder, nextStatus: OrderStatus) => {
    setUpdatingId(order.id);
    try {
      await apiRequest(`/admin/orders/${order.id}`, { method: "PATCH", body: { status: nextStatus } });
      push(`Order ${order.id.slice(0, 8).toUpperCase()} marked ${nextStatus}`);
      setReloadKey((key) => key + 1);
      setDetail((current) => (current && current.id === order.id ? { ...current, status: nextStatus } : current));
    } catch (err) {
      push(err instanceof Error ? err.message : "Could not update the order", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const items = data?.items ?? [];

  return (
    <div>
      <PageHeader
        title="Orders"
        description="Every order placed through the ShopAi checkout, stored in PostgreSQL."
        actions={
          <button type="button" onClick={() => setReloadKey((key) => key + 1)} className="btn-secondary !py-2.5 text-sm" disabled={loading}>
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        }
      />

      <div className="glass-dark mb-4 grid gap-3 p-4 sm:grid-cols-3">
        <div className="relative sm:col-span-2">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="search"
            aria-label="Search orders"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search customer name or email…"
            className="input-field !py-2.5 pl-9 text-sm"
          />
        </div>
        <select
          aria-label="Filter by status"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
          className="input-field !py-2.5 text-sm"
        >
          <option value="">All statuses</option>
          {STATUSES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      <div className="glass-dark overflow-hidden">
        {loading ? (
          <div className="space-y-2 p-4">
            {[...Array(5)].map((_, index) => (
              <Skeleton key={index} className="h-14" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={ReceiptText}
            title="No orders found"
            description="Orders placed in the storefront checkout appear here with their line items."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Order</th>
                    <th className="px-4 py-3 font-medium">Customer</th>
                    <th className="px-4 py-3 font-medium">Items</th>
                    <th className="px-4 py-3 font-medium">Total</th>
                    <th className="px-4 py-3 font-medium">Placed</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {items.map((order) => (
                    <tr key={order.id} className="transition hover:bg-white/[0.03]">
                      <td className="px-4 py-3 font-mono text-xs text-violet-200">{order.id.slice(0, 8).toUpperCase()}</td>
                      <td className="px-4 py-3">
                        <p className="text-gray-200">{order.customer_name}</p>
                        <p className="text-xs text-gray-500">{order.customer_email}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-300">{order.item_count}</td>
                      <td className="px-4 py-3 text-gray-200">{formatCurrency(order.total)}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{formatDateTime(order.created_at)}</td>
                      <td className="px-4 py-3">
                        <select
                          aria-label={`Status for order ${order.id.slice(0, 8)}`}
                          value={order.status}
                          disabled={updatingId === order.id}
                          onChange={(event) => void updateStatus(order, event.target.value as OrderStatus)}
                          className="rounded-lg border border-white/10 bg-ink-850 px-2 py-1 text-xs text-gray-200 disabled:opacity-50"
                        >
                          {STATUSES.map((item) => (
                            <option key={item} value={item}>
                              {item}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setDetail(order)}
                          aria-label={`View order ${order.id.slice(0, 8)}`}
                          className="rounded-lg p-2 text-gray-400 transition hover:bg-white/5 hover:text-white"
                        >
                          <Eye size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-white/10 px-4 py-3">
              <Pagination page={data?.page ?? 1} totalPages={data?.totalPages ?? 1} total={data?.total ?? 0} onPage={setPage} />
            </div>
          </>
        )}
      </div>

      <Modal
        open={Boolean(detail)}
        title={detail ? `Order ${detail.id.slice(0, 8).toUpperCase()}` : "Order"}
        description={detail ? `${detail.customer_name} · ${detail.customer_email} · ${formatDateTime(detail.created_at)}` : undefined}
        onClose={() => setDetail(null)}
        footer={
          <button type="button" onClick={() => setDetail(null)} className="btn-secondary !py-2.5 text-sm">
            Close
          </button>
        }
      >
        {detail && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={statusTone(detail.status)}>{detail.status}</Badge>
              <Badge>{detail.item_count} items</Badge>
              <Badge tone="success">{formatCurrency(detail.total)}</Badge>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="pb-2 font-medium">Item</th>
                    <th className="pb-2 text-right font-medium">Qty</th>
                    <th className="pb-2 text-right font-medium">Unit</th>
                    <th className="pb-2 text-right font-medium">Line total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {(detail.order_items ?? []).map((item) => (
                    <tr key={item.id}>
                      <td className="py-2 text-gray-200">{item.name}</td>
                      <td className="py-2 text-right text-gray-300">{item.quantity}</td>
                      <td className="py-2 text-right text-gray-300">{formatCurrency(item.unit_price)}</td>
                      <td className="py-2 text-right text-gray-200">{formatCurrency(item.unit_price * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between border-t border-white/10 pt-3 text-sm">
              <span className="text-gray-400">Tax</span>
              <span className="text-gray-200">{formatCurrency(detail.tax)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Order total</span>
              <span className="font-semibold text-white">{formatCurrency(detail.total + detail.tax)}</span>
            </div>
            {(detail.order_items ?? []).length === 0 && (
              <p className="text-sm text-gray-500">No line items were recorded for this order.</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
