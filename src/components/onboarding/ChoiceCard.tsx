"use client";

export function ChoiceCard({
  selected,
  onClick,
  icon,
  title,
  description,
  compact,
}: {
  selected: boolean;
  onClick: () => void;
  icon?: string;
  title: string;
  description?: string;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: compact ? "center" : "flex-start",
        gap: compact ? 10 : 14,
        width: "100%",
        textAlign: "left",
        padding: compact ? "12px 14px" : "16px 18px",
        border: `1px solid ${selected ? "#24457A" : "#E4E1DA"}`,
        borderRadius: 0,
        background: selected ? "#EEF2F8" : "#FFFFFF",
        cursor: "pointer",
        transition: "border-color 0.15s, background 0.15s",
      }}
    >
      {icon && (
        <span style={{ fontSize: compact ? "1.25rem" : "1.6rem", lineHeight: 1, flexShrink: 0 }}>
          {icon}
        </span>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: compact ? "0.9rem" : "0.95rem", color: "#14161A" }}>
          {title}
        </div>
        {description && (
          <div style={{ marginTop: 4, fontSize: "0.82rem", color: "#64748B", lineHeight: 1.45 }}>
            {description}
          </div>
        )}
      </div>
      <div
        style={{
          width: 18,
          height: 18,
          border: `1px solid ${selected ? "#24457A" : "#CBD5E1"}`,
          background: selected ? "#24457A" : "transparent",
          flexShrink: 0,
        }}
      />
    </button>
  );
}

export function MultiChoiceChip({
  selected,
  onClick,
  icon,
  label,
}: {
  selected: boolean;
  onClick: () => void;
  icon?: string;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "9px 14px",
        borderRadius: 0,
        border: `1px solid ${selected ? "#24457A" : "#E4E1DA"}`,
        background: selected ? "#EEF2F8" : "#FFFFFF",
        fontWeight: 700,
        fontSize: "0.85rem",
        cursor: "pointer",
        color: selected ? "#24457A" : "#475569",
      }}
    >
      {icon && <span>{icon}</span>}
      {label}
    </button>
  );
}
