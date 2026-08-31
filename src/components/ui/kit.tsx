import type { CSSProperties, ReactNode } from "react";

export const ui = {
  border: "#E4E1DA",
  ink: "#14161A",
  sub: "#64748B",
  brand: "#24457A",
  bgSoft: "#FAFAF8",
  green: "#16A34A",
  amber: "#B45309",
  red: "#B91C1C",
};

export const cardStyle: CSSProperties = {
  border: `1px solid ${ui.border}`,
  background: "#fff",
  borderRadius: 6,
  padding: 20,
};

export const kicker: CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 9,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  color: ui.brand,
};

export function Card({ children, style, pad = 20 }: { children: ReactNode; style?: CSSProperties; pad?: number }) {
  return <div style={{ ...cardStyle, padding: pad, ...style }}>{children}</div>;
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, flexWrap: "wrap", marginBottom: 6 }}>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", margin: 0 }}>{title}</h2>
        {subtitle && <p style={{ margin: "4px 0 0", color: ui.sub, fontSize: 14 }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatTile({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "up" | "down";
}) {
  const toneColor = tone === "up" ? ui.green : tone === "down" ? ui.red : ui.ink;
  return (
    <div style={{ ...cardStyle, padding: 18 }}>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: ui.sub }}>
        {label}
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, marginTop: 8, fontFamily: "'JetBrains Mono', monospace", color: toneColor, letterSpacing: "-0.02em" }}>
        {value}
      </div>
      {hint && <div style={{ fontSize: 12, color: ui.sub, marginTop: 3 }}>{hint}</div>}
    </div>
  );
}

export function Badge({ children, tone = "blue" }: { children: ReactNode; tone?: "blue" | "green" | "amber" | "gray" }) {
  const map = {
    blue: { bg: "#DBEAFE", fg: "#1E40AF" },
    green: { bg: "#DCFCE7", fg: "#166534" },
    amber: { bg: "#FEF3C7", fg: "#92400E" },
    gray: { bg: "#F1F5F9", fg: "#475569" },
  }[tone];
  return (
    <span style={{ fontSize: 10, fontWeight: 800, background: map.bg, color: map.fg, padding: "3px 8px", borderRadius: 999, textTransform: "uppercase", letterSpacing: "0.04em" }}>
      {children}
    </span>
  );
}

/** Tiny dependency-free bar chart. data = [{label, value}] */
export function BarChart({
  data,
  height = 140,
  format = (n: number) => String(n),
  color = ui.brand,
}: {
  data: { label: string; value: number }[];
  height?: number;
  format?: (n: number) => string;
  color?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height, overflowX: "auto" }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: "1 0 14px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minWidth: 14 }} title={`${d.label}: ${format(d.value)}`}>
          <div
            style={{
              width: "100%",
              maxWidth: 34,
              height: `${(d.value / max) * (height - 24)}px`,
              minHeight: 2,
              background: color,
              borderRadius: "3px 3px 0 0",
              transition: "height 0.3s ease",
            }}
          />
          <span style={{ fontSize: 8, color: ui.sub, whiteSpace: "nowrap", fontFamily: "'JetBrains Mono', monospace" }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}
