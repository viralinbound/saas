"use client";

import { useEffect, useState } from "react";

type Member = { id: string; user_id: string; role: string; status: string; title: string | null; created_at: string };
type Invite = { id: string; email: string; role: string; created_at: string; expires_at: string };

const box: React.CSSProperties = { border: "1px solid #E4E1DA", background: "#fff", padding: 20 };
const inp: React.CSSProperties = { padding: "9px 11px", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 14 };

export function TeamClient() {
  const [org, setOrg] = useState<{ id: string; name: string; slug: string } | null>(null);
  const [myRole, setMyRole] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("staff");
  const [msg, setMsg] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    const d = await fetch("/api/team").then((r) => r.json());
    setOrg(d.org);
    setMyRole(d.myRole);
    setMembers(d.members || []);
    setInvites(d.invites || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setMsg(""); setInviteUrl("");
    const res = await fetch("/api/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role }),
    });
    const d = await res.json();
    if (res.ok) {
      setEmail("");
      setInviteUrl(d.inviteUrl);
      setMsg(`Invite created for ${d.invite.email}. Share this link:`);
      load();
    } else setMsg(d.error || "Could not create invite.");
  }

  const canManage = myRole === "owner" || myRole === "admin";

  if (loading) return <p style={{ opacity: 0.6 }}>Loading team…</p>;

  return (
    <div style={{ display: "grid", gap: 20, maxWidth: 760 }}>
      <div style={box}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: "#24457A" }}>company</div>
        <div style={{ fontSize: 20, fontWeight: 800, marginTop: 6 }}>{org?.name || "—"}</div>
        <p style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>
          Each company is an isolated tenant. Members here can sign in and work only on this company&apos;s stores, catalog and orders — never another company&apos;s data.
        </p>
        <p style={{ fontSize: 13, marginTop: 8 }}>Your role: <strong>{myRole || "—"}</strong></p>
      </div>

      <div style={box}>
        <h3 style={{ fontSize: 18, fontWeight: 800 }}>Members ({members.length})</h3>
        <table style={{ width: "100%", marginTop: 12, borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", fontSize: 12, color: "#64748B" }}>
              <th style={{ padding: "6px 4px" }}>User ID</th>
              <th style={{ padding: "6px 4px" }}>Role</th>
              <th style={{ padding: "6px 4px" }}>Status</th>
              <th style={{ padding: "6px 4px" }}>Joined</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} style={{ borderTop: "1px solid #E4E1DA", fontSize: 13 }}>
                <td style={{ padding: "8px 4px", fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{m.user_id.slice(0, 8)}…</td>
                <td style={{ padding: "8px 4px", fontWeight: 700 }}>{m.role}</td>
                <td style={{ padding: "8px 4px" }}>{m.status}</td>
                <td style={{ padding: "8px 4px" }}>{new Date(m.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {canManage && (
        <div style={box}>
          <h3 style={{ fontSize: 18, fontWeight: 800 }}>Invite a teammate</h3>
          <form onSubmit={invite} style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            <input type="email" required placeholder="teammate@email.com" value={email} onChange={(e) => setEmail(e.target.value)} style={{ ...inp, flex: 1, minWidth: 220 }} />
            <select value={role} onChange={(e) => setRole(e.target.value)} style={inp}>
              <option value="admin">Admin</option>
              <option value="staff">Staff</option>
              <option value="viewer">Viewer</option>
            </select>
            <button type="submit" style={{ border: 0, background: "#24457A", color: "#fff", padding: "10px 16px", fontWeight: 800, cursor: "pointer", borderRadius: 8 }}>
              Create invite
            </button>
          </form>
          {msg && <p style={{ marginTop: 10, fontSize: 14, fontWeight: 600 }}>{msg}</p>}
          {inviteUrl && (
            <code style={{ display: "block", marginTop: 6, padding: 10, background: "#F1F5F9", borderRadius: 6, fontSize: 12, wordBreak: "break-all" }}>{inviteUrl}</code>
          )}
        </div>
      )}

      {invites.length > 0 && (
        <div style={box}>
          <h3 style={{ fontSize: 18, fontWeight: 800 }}>Pending invites ({invites.length})</h3>
          <ul style={{ marginTop: 10, display: "grid", gap: 6, fontSize: 13 }}>
            {invites.map((i) => (
              <li key={i.id} style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #E4E1DA", paddingTop: 6 }}>
                <span>{i.email} · <strong>{i.role}</strong></span>
                <span style={{ color: "#64748B" }}>expires {new Date(i.expires_at).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
