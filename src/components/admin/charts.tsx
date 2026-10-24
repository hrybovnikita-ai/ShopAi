import { useId } from "react";

export interface ChartPoint {
  label: string;
  value: number;
}

/** Dependency-free SVG line chart used by the System Monitor page. */
export function LineChart({
  points,
  height = 160,
  color = "#a875ff",
  valueSuffix = "",
}: {
  points: ChartPoint[];
  height?: number;
  color?: string;
  valueSuffix?: string;
}) {
  const gradientId = useId();
  const width = 600;
  const padding = { top: 12, right: 8, bottom: 8, left: 8 };

  if (points.length === 0) {
    return (
      <div className="flex h-[160px] items-center justify-center rounded-xl border border-dashed border-white/10 text-sm text-gray-500">
        No data for this period
      </div>
    );
  }

  const max = Math.max(...points.map((point) => point.value), 1);
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const coordinates = points.map((point, index) => {
    const x = padding.left + (points.length === 1 ? innerWidth / 2 : (index / (points.length - 1)) * innerWidth);
    const y = padding.top + innerHeight - (point.value / max) * innerHeight;
    return { ...point, x, y };
  });

  const linePath = coordinates.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${coordinates[coordinates.length - 1].x.toFixed(1)},${(height - padding.bottom).toFixed(1)} L${coordinates[0].x.toFixed(1)},${(height - padding.bottom).toFixed(1)} Z`;

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="h-40 w-full" role="img" aria-label="Performance chart">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((ratio) => (
          <line
            key={ratio}
            x1={padding.left}
            x2={width - padding.right}
            y1={padding.top + innerHeight * ratio}
            y2={padding.top + innerHeight * ratio}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {coordinates.length > 1 && <path d={areaPath} fill={`url(#${gradientId})`} />}
        <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        {coordinates.map((point) => (
          <circle key={point.label} cx={point.x} cy={point.y} r="2.5" fill={color} vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      <div className="mt-2 flex justify-between text-[10px] text-gray-500">
        <span>{points[0].label}</span>
        <span>
          max {max}
          {valueSuffix}
        </span>
        <span>{points[points.length - 1].label}</span>
      </div>
    </div>
  );
}

/** Horizontal bar list — status codes, slowest endpoints, top products. */
export function BarList({
  items,
  emptyLabel = "No data",
  tone = "violet",
}: {
  items: { label: string; value: number; caption?: string }[];
  emptyLabel?: string;
  tone?: "violet" | "blue" | "emerald" | "danger";
}) {
  const tones = {
    violet: "from-violet-500 to-violet-400",
    blue: "from-blue-500 to-blue-400",
    emerald: "from-emerald-500 to-emerald-400",
    danger: "from-red-500 to-rose-400",
  } as const;

  if (items.length === 0) {
    return <p className="py-6 text-center text-sm text-gray-500">{emptyLabel}</p>;
  }

  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.label}>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="truncate text-gray-300">{item.label}</span>
            <span className="shrink-0 text-gray-400">
              {item.value}
              {item.caption ? <span className="ml-2 text-xs text-gray-500">{item.caption}</span> : null}
            </span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/5">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${tones[tone]}`}
              style={{ width: `${Math.max(3, (item.value / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
