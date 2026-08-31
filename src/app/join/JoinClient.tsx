"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function JoinClient() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") || "";
  const [state, setState] = useState<"idle" | "working" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!token) { setState("error"); setMsg("Missing invite token."); return; }
    (async () => {
      setState("working");
      // must be signed in first
      const me = await fetch("/api/auth/me").then((r) => r.json());
      if (!me.user) {
        router.replace(`/login?next=${encodeURIComponent(`/join?token=${token}`)}`);
        return;
      }
      const res = await fetch("/api/team/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const d = await res.json();
      if (res.ok) { setState("done"); setMsg("You've joined the company. Redirecting…"); setTimeout(() => router.replace("/app"), 1200); }
      else { setState("error"); setMsg(d.error || "Could not accept the invite."); }
    })();
  }, [token, router]);

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", fontFamily: "'Instrument Sans', system-ui, sans-serif", padding: 24 }}>
      <div style={{ maxWidth: 420, textAlign: "center", border: "1px solid #E2E8F0", borderRadius: 12, padding: 32, background: "#fff" }}>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Company invite</h1>
        <p style={{ marginTop: 12, color: state === "error" ? "#DC2626" : "#475569" }}>
          {state === "working" ? "Accepting your invite…" : msg || "Preparing…"}
        </p>
      </div>
    </div>
  );
}
