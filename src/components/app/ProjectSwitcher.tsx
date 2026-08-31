"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Project = { id: string; name: string; slug: string; status: string; brandedHost: string };

export function ProjectSwitcher({ currentName, currentSlug }: { currentName: string; currentSlug: string }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.projects)) setProjects(d.projects);
        setActiveId(d.activeId ?? null);
      })
      .catch(() => {});
  }, []);

  async function switchTo(id: string) {
    if (!id || id === activeId || busy) return;
    setBusy(true);
    await fetch("/api/projects", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => {});
    // reload the CURRENT page so every server component re-resolves against the
    // newly-active project without navigating away
    window.location.reload();
  }

  const box: React.CSSProperties = { border: "1px solid rgba(250,249,246,0.24)", padding: 12 };
  const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace", fontSize: 8, letterSpacing: "0.18em", textTransform: "uppercase", opacity: 0.6 };

  return (
    <div style={box}>
      <div style={mono}>project</div>
      {projects.length > 1 ? (
        <select
          value={activeId ?? ""}
          onChange={(e) => switchTo(e.target.value)}
          disabled={busy}
          style={{ width: "100%", marginTop: 7, background: "#22252B", color: "#fff", border: "1px solid #3A3F47", borderRadius: 6, padding: "8px 8px", fontSize: 13, fontWeight: 800 }}
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} {p.status === "live" ? "· live" : p.status === "preview" ? "· demo" : "· draft"}
            </option>
          ))}
        </select>
      ) : (
        <div style={{ fontSize: 15, fontWeight: 800, marginTop: 7 }}>{currentName}</div>
      )}
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.1em", marginTop: 6 }}>/s/{currentSlug}</div>
      <Link href="/app/projects" style={{ display: "inline-block", marginTop: 8, fontSize: 11, fontWeight: 800, color: "#9FBBE0", textDecoration: "none" }}>
        + New / manage projects →
      </Link>
    </div>
  );
}
