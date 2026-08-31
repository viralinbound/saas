"use client";

import { useState } from "react";
import Link from "next/link";
import { DOMAIN_EXTENSIONS, cleanDomainQuery } from "@/lib/marketing-content";

export function DomainSearchWidget({ compact }: { compact?: boolean }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<string | null>(null);

  function search(e?: React.FormEvent) {
    e?.preventDefault();
    const clean = cleanDomainQuery(query);
    if (!clean) return;
    setResults(clean);
  }

  return (
    <div>
      <form onSubmit={search} className="domain-search-box">
        <label style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--primary-navy)", display: "block", marginBottom: 8 }}>
          Check Your Brand Domain Availability:
        </label>
        <div className="domain-input-group">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="yourbrandname"
            aria-label="Brand domain search"
          />
          <button type="submit" className="btn btn-primary btn-sm" style={{ whiteSpace: "nowrap" }}>
            Check Availability →
          </button>
        </div>
      </form>

      {!compact && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
          {["🔥 .com (₹899 Free)", "⚡ .in (₹499 Free)", "🛍️ .store (₹299 Free)", "✨ .shop (₹199 Free)"].map((t) => (
            <span key={t} style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--slate-600)", background: "#fff", border: "1px solid var(--slate-200)", padding: "4px 10px", borderRadius: 999 }}>
              {t}
            </span>
          ))}
        </div>
      )}

      <div className={`all-domains-results-container${results ? " active" : ""}`}>
        {results && (
          <>
            <div className="results-header-info">
              <div className="results-title">Results for &quot;{results}&quot;</div>
            </div>
            <div className="domain-results-grid">
              {DOMAIN_EXTENSIONS.map((item) => (
                <div key={item.ext} className="domain-item-card">
                  <div>
                    <div className="domain-name-text">
                      {results}
                      {item.ext}
                    </div>
                    <div className="domain-status-tag">✓ Included Free in Plan · {item.badge}</div>
                  </div>
                  <div className="domain-price-action">
                    <span className="domain-price-val">{item.price}</span>
                    <Link href={`/signup?domain=${encodeURIComponent(`${results}${item.ext}`)}`} className="btn btn-primary btn-sm">
                      Claim →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
