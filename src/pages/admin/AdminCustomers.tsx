import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, RefreshCw, Search, Users } from "lucide-react";
import { apiRequest } from "@/lib/api";
import type { AdminCustomer, Paginated } from "@/types/admin";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { Badge, EmptyState, PageHeader, Pagination, Skeleton } from "@/components/admin/ui";

export function AdminCustomers() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Paginated<AdminCustomer> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const load = useCallback(async (signal?: AbortSignal) => {
    const params = new URLSearchParams({ page: String(page), pageSize: "10" });
    if (search) params.set("search", search);

    setLoading(true);
    try {
      const result = await apiRequest<Paginated<AdminCustomer>>(`/admin/customers?${params.toString()}`, { signal });
      setData(result);
      setError(null);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Could not load customers");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const items = data?.items ?? [];

  return (
    <div>
      <PageHeader
        title="Customers"
        description="Registered authentication accounts. Demo accounts are temporary and never stored here."
        actions={
          <button type="button" onClick={() => void load()} className="btn-secondary !py-2.5 text-sm" disabled={loading}>
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        }
      />

      <div className="glass-dark mb-4 p-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="search"
            aria-label="Search customers"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search by email…"
            className="input-field !py-2.5 pl-9 text-sm"
          />
        </div>
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
            {[...Array(4)].map((_, index) => (
              <Skeleton key={index} className="h-14" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState icon={Users} title="No customers found" description="Real accounts created through the sign-up form appear here." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Joined</th>
                    <th className="px-4 py-3 font-medium">Last sign-in</th>
                    <th className="px-4 py-3 font-medium">Orders</th>
                    <th className="px-4 py-3 font-medium">Lifetime value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {items.map((customer) => (
                    <tr key={customer.id} className="transition hover:bg-white/[0.03]">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full gradient-bg text-xs font-bold uppercase text-white">
                            {customer.email.charAt(0)}
                          </span>
                          <span className="truncate text-gray-200">{customer.email}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">{formatDate(customer.created_at)}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">{formatDateTime(customer.last_sign_in_at)}</td>
                      <td className="px-4 py-3">
                        <Badge tone={customer.order_count > 0 ? "violet" : "neutral"}>{customer.order_count}</Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-200">{formatCurrency(customer.lifetime_value)}</td>
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
    </div>
  );
}
