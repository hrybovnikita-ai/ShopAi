import { useCallback, useEffect, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  CircleSlash,
  Clock,
  Database,
  Gauge,
  RefreshCw,
  ServerCog,
  Sparkles,
  XCircle,
} from "lucide-react";
import { apiRequest } from "@/lib/api";
import type { HealthStatus, MonitorErrorEntry, MonitorOverview, MonitorRequestEntry } from "@/types/admin";
import { formatDateTime, formatNumber, formatPercent, formatUptime } from "@/lib/format";
import { BarList, LineChart } from "@/components/admin/charts";
import { Badge, EmptyState, PageHeader, Skeleton, StatCard } from "@/components/admin/ui";

const WINDOWS = [
  { value: 1, label: "Last 1h" },
  { value: 24, label: "Last 24h" },
  { value: 168, label: "Last 7d" },
];

function hourLabel(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return `${String(date.getHours()).padStart(2, "0")}:00`;
}

export function AdminMonitor() {
  const [hours, setHours] = useState(24);
  const [overview, setOverview] = useState<MonitorOverview | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [errors, setErrors] = useState<MonitorErrorEntry[]>([]);
  const [requests, setRequests] = useState<MonitorRequestEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const loadRef = useRef<() => Promise<void>>();

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    const results = await Promise.allSettled([
      apiRequest<HealthStatus>("/health", { signal }),
      apiRequest<MonitorOverview>(`/admin/monitor/overview?hours=${hours}`, { signal }),
      apiRequest<{ errors: MonitorErrorEntry[] }>("/admin/monitor/errors?limit=15", { signal }),
      apiRequest<{ requests: MonitorRequestEntry[] }>("/admin/monitor/requests?limit=15", { signal }),
    ]);

    if (signal?.aborted) return;

    const [healthResult, overviewResult, errorsResult, requestsResult] = results;

    if (healthResult.status === "fulfilled") setHealth(healthResult.value);
    if (overviewResult.status === "fulfilled") setOverview(overviewResult.value);
    if (errorsResult.status === "fulfilled") setErrors(errorsResult.value.errors);
    if (requestsResult.status === "fulfilled") setRequests(requestsResult.value.requests);

    const failure = results.find((result) => result.status === "rejected");
    if (failure && failure.status === "rejected") {
      const reason = failure.reason;
      setError(reason instanceof Error ? reason.message : "Monitoring data could not be loaded");
    } else {
      setError(null);
    }

    setLastUpdated(new Date());
    setLoading(false);
  }, [hours]);

  useEffect(() => {
    loadRef.current = () => load();
  }, [load]);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  useEffect(() => {
    if (!autoRefresh) return;
    const timer = window.setInterval(() => {
      void loadRef.current?.();
    }, 10_000);
    return () => window.clearInterval(timer);
  }, [autoRefresh]);

  const errorRate = overview && overview.totalRequests > 0
    ? (overview.failedRequests / overview.totalRequests) * 100
    : 0;

  const statusItems = overview
    ? Object.entries(overview.byStatus)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([status, count]) => ({
          label: `HTTP ${status}`,
          value: count,
        }))
    : [];

  return (
    <div>
      <PageHeader
        title="System Monitor"
        description="Health checks, request metrics and application errors recorded by the ShopAi API service."
        actions={
          <>
            <select
              aria-label="Monitoring window"
              value={hours}
              onChange={(event) => setHours(Number(event.target.value))}
              className="input-field !w-auto !py-2.5 text-sm"
            >
              {WINDOWS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-xs text-gray-400">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(event) => setAutoRefresh(event.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-ink-800 text-violet-600"
              />
              Auto-refresh
            </label>
            <button type="button" onClick={() => void load()} className="btn-secondary !py-2.5 text-sm" disabled={loading}>
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </>
        }
      />

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {loading && !overview ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, index) => (
            <Skeleton key={index} className="h-28" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="glass-dark p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">API service</p>
                  <div className="mt-2 flex items-center gap-2">
                    {health?.status === "ok" ? (
                      <CheckCircle2 size={18} className="text-emerald-400" />
                    ) : (
                      <XCircle size={18} className="text-red-400" />
                    )}
                    <span className="font-display text-lg font-semibold text-white">
                      {health ? (health.status === "ok" ? "Healthy" : "Degraded") : "No data"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {health ? `Uptime ${formatUptime(health.uptimeSeconds)}` : "Health check unavailable"}
                  </p>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
                  <ServerCog size={20} />
                </span>
              </div>
            </div>

            <div className="glass-dark p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Database</p>
                  <div className="mt-2 flex items-center gap-2">
                    {health?.database.ok ? (
                      <CheckCircle2 size={18} className="text-emerald-400" />
                    ) : (
                      <XCircle size={18} className="text-red-400" />
                    )}
                    <span className="font-display text-lg font-semibold text-white">
                      {health ? (health.database.ok ? "Connected" : "Unavailable") : "No data"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {health?.database.ok ? `${health.database.latencyMs} ms round trip` : health?.database.error ?? "Not configured"}
                  </p>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 text-blue-300">
                  <Database size={20} />
                </span>
              </div>
            </div>

            <StatCard
              label="Requests"
              value={formatNumber(overview?.totalRequests ?? 0)}
              hint={`${WINDOWS.find((item) => item.value === hours)?.label ?? ""} · all endpoints`}
              icon={Activity}
              accent="violet"
            />
            <StatCard
              label="Error rate"
              value={formatPercent(errorRate)}
              hint={`${formatNumber(overview?.failedRequests ?? 0)} failed responses`}
              icon={AlertTriangle}
              accent={errorRate > 5 ? "amber" : "emerald"}
            />
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <StatCard label="Median latency" value={`${overview?.p50Ms ?? 0} ms`} hint="p50 response time" icon={Clock} accent="blue" />
            <StatCard label="95th percentile" value={`${overview?.p95Ms ?? 0} ms`} hint="p95 response time" icon={Gauge} accent="violet" />
            <div className="glass-dark p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">AI provider</p>
                  <div className="mt-2 flex items-center gap-2">
                    {health?.ai.configured ? (
                      <Sparkles size={18} className="text-violet-300" />
                    ) : (
                      <CircleSlash size={18} className="text-gray-400" />
                    )}
                    <span className="font-display text-lg font-semibold text-white">
                      {health ? (health.ai.configured ? "Configured" : "Not configured") : "No data"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Embeddings: {health?.ai.embeddings ?? "unknown"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <section className="glass-dark p-5">
              <h2 className="mb-4 font-display text-lg font-semibold text-white">Requests over time</h2>
              <LineChart
                points={(overview?.timeline ?? []).map((point) => ({ label: hourLabel(point.bucket), value: point.count }))}
                color="#a875ff"
              />
            </section>
            <section className="glass-dark p-5">
              <h2 className="mb-1 font-display text-lg font-semibold text-white">Average response time</h2>
              <p className="mb-3 text-xs text-gray-500">Per hour, in milliseconds</p>
              <LineChart
                points={(overview?.timeline ?? []).map((point) => ({ label: hourLabel(point.bucket), value: point.avgMs }))}
                color="#4d9fff"
                valueSuffix=" ms"
              />
            </section>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <section className="glass-dark p-5">
              <h2 className="mb-4 font-display text-lg font-semibold text-white">HTTP status codes</h2>
              <BarList items={statusItems} emptyLabel="No requests recorded in this window" tone="blue" />
            </section>
            <section className="glass-dark p-5">
              <h2 className="mb-4 font-display text-lg font-semibold text-white">Busiest endpoints</h2>
              <BarList
                items={(overview?.byPath ?? []).map((entry) => ({
                  label: entry.path,
                  value: entry.count,
                  caption: `${entry.avgMs} ms avg · ${entry.errors} errors`,
                }))}
                emptyLabel="No endpoint traffic recorded"
                tone="violet"
              />
            </section>
          </div>

          <section className="glass-dark mt-6 overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 p-5">
              <h2 className="font-display text-lg font-semibold text-white">Recent errors &amp; warnings</h2>
              <Badge tone={errors.some((entry) => entry.level === "error") ? "danger" : "neutral"}>
                {errors.filter((entry) => entry.level === "error").length} errors
              </Badge>
            </div>
            {errors.length === 0 ? (
              <EmptyState icon={CheckCircle2} title="No errors recorded" description="Structured API errors and warnings will appear here." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Level</th>
                      <th className="px-4 py-3 font-medium">Message</th>
                      <th className="px-4 py-3 font-medium">Endpoint</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">When</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {errors.map((entry) => (
                      <tr key={entry.id}>
                        <td className="px-4 py-3">
                          <Badge tone={entry.level === "error" ? "danger" : "warning"}>{entry.level}</Badge>
                        </td>
                        <td className="max-w-[24rem] px-4 py-3 text-gray-200">
                          <p className="truncate" title={entry.message}>{entry.message}</p>
                          {entry.code && <p className="text-xs text-gray-500">{entry.code}</p>}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-400">
                          {entry.method} {entry.path}
                        </td>
                        <td className="px-4 py-3 text-gray-300">{entry.status ?? "—"}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{formatDateTime(entry.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="glass-dark mt-6 overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 p-5">
              <h2 className="font-display text-lg font-semibold text-white">Latest API requests</h2>
              <span className="text-xs text-gray-500">
                {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString("en-US")}` : ""}
              </span>
            </div>
            {requests.length === 0 ? (
              <EmptyState icon={Activity} title="No requests logged yet" description="API traffic is recorded as the dashboard and storefront call the backend." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Method</th>
                      <th className="px-4 py-3 font-medium">Path</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Duration</th>
                      <th className="px-4 py-3 font-medium">When</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {requests.map((entry) => (
                      <tr key={entry.id}>
                        <td className="px-4 py-2.5 font-mono text-xs text-violet-200">{entry.method}</td>
                        <td className="px-4 py-2.5 font-mono text-xs text-gray-300">{entry.path}</td>
                        <td className="px-4 py-2.5">
                          <Badge tone={entry.status >= 500 ? "danger" : entry.status >= 400 ? "warning" : "success"}>
                            {entry.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5 text-gray-400">{entry.duration_ms} ms</td>
                        <td className="px-4 py-2.5 text-xs text-gray-500">{formatDateTime(entry.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
