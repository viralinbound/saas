export const authStyles = {
  label: {
    fontSize: "0.8rem",
    fontWeight: 700,
    display: "block",
    marginBottom: 6,
    color: "#334155",
  } as React.CSSProperties,
  inputBase: {
    width: "100%",
    padding: "12px 14px",
    border: "1px solid #E4E1DA",
    borderRadius: 0,
    fontSize: "1rem",
    background: "#fff",
    outline: "none",
    transition: "border-color 0.15s, box-shadow 0.15s",
  } as React.CSSProperties,
  get input() {
    return this.inputBase;
  },
  btnPrimary: {
    width: "100%",
    padding: "14px 16px",
    background: "#14161A",
    color: "#fff",
    border: 0,
    borderRadius: 0,
    fontWeight: 800,
    fontSize: "0.95rem",
    cursor: "pointer",
    marginTop: 4,
  } as React.CSSProperties,
  btnSecondary: {
    width: "100%",
    padding: "14px 16px",
    background: "#fff",
    color: "#14161A",
    border: "1px solid #E4E1DA",
    borderRadius: 0,
    fontWeight: 700,
    fontSize: "0.95rem",
    cursor: "pointer",
  } as React.CSSProperties,
  tabRow: {
    display: "flex",
    gap: 4,
    marginBottom: 24,
    background: "#EEF2F8",
    padding: 4,
    borderRadius: 0,
  } as React.CSSProperties,
  tab: (active: boolean) =>
    ({
      flex: 1,
      padding: "10px 12px",
      border: active ? "1px solid #E4E1DA" : "1px solid transparent",
      borderRadius: 0,
      fontWeight: 800,
      fontSize: "0.85rem",
      cursor: "pointer",
      background: active ? "#fff" : "transparent",
      color: active ? "#24457A" : "#64748B",
      boxShadow: "none",
    }) as React.CSSProperties,
  divider: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    margin: "8px 0",
    color: "#94A3B8",
    fontSize: "0.8rem",
    fontWeight: 600,
  } as React.CSSProperties,
  error: {
    background: "#FEF2F2",
    border: "1px solid #FECACA",
    color: "#B91C1C",
    padding: "10px 12px",
    borderRadius: 0,
    fontSize: "0.88rem",
  } as React.CSSProperties,
  success: {
    background: "#ECFDF5",
    border: "1px solid #A7F3D0",
    color: "#047857",
    padding: "10px 12px",
    borderRadius: 0,
    fontSize: "0.88rem",
  } as React.CSSProperties,
};

export function AuthDivider() {
  return (
    <div style={authStyles.divider}>
      <span style={{ flex: 1, height: 1, background: "#E2E8F0" }} />
      or
      <span style={{ flex: 1, height: 1, background: "#E2E8F0" }} />
    </div>
  );
}

export function AuthMessage({ message, type = "error" }: { message: string; type?: "error" | "success" }) {
  return <div style={type === "error" ? authStyles.error : authStyles.success}>{message}</div>;
}

export function AuthInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className="auth-input" style={authStyles.inputBase} {...props} />;
}
