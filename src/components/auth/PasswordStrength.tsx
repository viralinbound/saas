"use client";

export function scorePassword(v: string): { score: number; label: string; color: string } {
  if (!v) return { score: 0, label: "", color: "#E2E8F0" };
  let s = 0;
  if (v.length >= 8) s++;
  if (v.length >= 12) s++;
  if (/[a-z]/.test(v) && /[A-Z]/.test(v)) s++;
  if (/\d/.test(v)) s++;
  if (/[^A-Za-z0-9]/.test(v)) s++;
  const buckets = [
    { label: "Too weak", color: "#DC2626" },
    { label: "Weak", color: "#EA580C" },
    { label: "Fair", color: "#CA8A04" },
    { label: "Good", color: "#16A34A" },
    { label: "Strong", color: "#15803D" },
    { label: "Strong", color: "#15803D" },
  ];
  return { score: s, ...buckets[Math.min(s, 5)] };
}

export function PasswordStrength({ value }: { value: string }) {
  const { score, label, color } = scorePassword(value);
  if (!value) return null;
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: "flex", gap: 3 }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              background: i < score ? color : "#E2E8F0",
              transition: "background 0.15s",
            }}
          />
        ))}
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color, marginTop: 4 }}>{label}</div>
    </div>
  );
}
