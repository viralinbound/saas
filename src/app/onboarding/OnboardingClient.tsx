"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChoiceCard, MultiChoiceChip } from "@/components/onboarding/ChoiceCard";
import {
  BUSINESS_STAGES,
  BUSINESS_TYPES,
  HEARD_FROM,
  MONTHLY_ORDERS,
  ONBOARDING_GOALS,
  ONBOARDING_STEPS,
  REVENUE_RANGES,
  SALES_CHANNELS,
  SELLING_CATEGORIES,
  TEAM_SIZES,
} from "@/lib/onboarding";
import { PLANS, THEMES, slugify, storeUrl } from "@/lib/constants";

const TOTAL_STEPS = ONBOARDING_STEPS.length;

export default function OnboardingClient() {
  const router = useRouter();
  const params = useSearchParams();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userName, setUserName] = useState("");
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const [createdStore, setCreatedStore] = useState<{ name: string; slug: string } | null>(null);

  const [intent, setIntent] = useState({
    goal: "",
    category: "",
    businessStage: "",
    salesChannels: [] as string[],
    revenueRange: "",
    teamSize: "",
    monthlyOrders: "",
    businessType: "",
    heardFrom: "",
  });

  const [form, setForm] = useState({
    name: "",
    slug: "",
    industry: "apparel",
    theme: params.get("theme") || "fashion",
    plan: (params.get("plan") as keyof typeof PLANS) || "free",
    customDomain: "",
    companyName: "",
    companyPhone: "",
    gstin: "",
    website: "",
    addressLine1: "",
    city: "",
    state: "",
    pincode: "",
  });

  useEffect(() => {
    const launched = params.get("launched") === "1";
    if (launched) setStep(8);

    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.user?.name) setUserName(data.user.name.split(" ")[0]);
        if (data.store) {
          // Onboarding already finished → skip setup, go to the console.
          setCreatedStore({ name: data.store.name, slug: data.store.slug });
          if (!launched) router.replace("/app");
        }
      });

    // Resume a half-finished onboarding from the answers we already saved.
    fetch("/api/profile/onboarding")
      .then((r) => r.json())
      .then((d) => {
        const ob = d?.onboarding;
        if (!ob || typeof ob !== "object") return;
        setIntent((prev) => ({
          ...prev,
          goal: ob.goal ?? prev.goal,
          category: ob.category ?? prev.category,
          businessStage: ob.businessStage ?? prev.businessStage,
          salesChannels: Array.isArray(ob.salesChannels) ? ob.salesChannels : prev.salesChannels,
          revenueRange: ob.revenueRange ?? prev.revenueRange,
          teamSize: ob.teamSize ?? prev.teamSize,
          monthlyOrders: ob.monthlyOrders ?? prev.monthlyOrders,
          businessType: ob.businessType ?? prev.businessType,
          heardFrom: ob.heardFrom ?? prev.heardFrom,
        }));
        if (ob.category) {
          const cat = SELLING_CATEGORIES.find((c) => c.id === ob.category);
          if (cat) setForm((prev) => ({ ...prev, industry: cat.industry, theme: cat.theme }));
        }
        // Jump to the first step they haven't answered.
        if (!params.get("launched")) {
          if (!ob.goal) setStep(1);
          else if (!ob.category) setStep(2);
          else if (!ob.businessStage || !(ob.salesChannels?.length)) setStep(3);
          else setStep(4);
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedCategory = SELLING_CATEGORIES.find((c) => c.id === intent.category);
  const previewSlug = useMemo(() => slugify(form.slug || form.name || "your-store"), [form.slug, form.name]);
  const previewUrl = useMemo(() => storeUrl(previewSlug), [previewSlug]);

  useEffect(() => {
    if (step !== 5 || previewSlug.length < 3) {
      setSlugStatus("idle");
      return;
    }
    setSlugStatus("checking");
    const t = setTimeout(async () => {
      const res = await fetch(`/api/stores/check-slug?slug=${encodeURIComponent(previewSlug)}`);
      const data = await res.json();
      setSlugStatus(data.available ? "available" : data.error ? "invalid" : "taken");
    }, 400);
    return () => clearTimeout(t);
  }, [previewSlug, step]);

  // Account + store are made — drop the merchant on their dashboard.
  useEffect(() => {
    if (step === 8 && createdStore) {
      const t = setTimeout(() => {
        router.push("/app");
        router.refresh();
      }, 2600);
      return () => clearTimeout(t);
    }
  }, [step, createdStore, router]);

  function toggleChannel(id: string) {
    setIntent((prev) => ({
      ...prev,
      salesChannels: prev.salesChannels.includes(id)
        ? prev.salesChannels.filter((c) => c !== id)
        : [...prev.salesChannels, id],
    }));
  }

  function selectCategory(id: string) {
    const cat = SELLING_CATEGORIES.find((c) => c.id === id);
    setIntent((prev) => ({ ...prev, category: id }));
    if (cat) {
      setForm((prev) => ({ ...prev, industry: cat.industry, theme: cat.theme }));
    }
  }

  async function saveIntent() {
    await fetch("/api/profile/onboarding", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(intent),
    }).catch(() => {});
  }

  function canContinue(): boolean {
    if (step === 1) return !!intent.goal;
    if (step === 2) return !!intent.category;
    if (step === 3) return !!intent.businessStage && intent.salesChannels.length > 0;
    if (step === 4) return form.name.trim().length >= 2 && form.companyName.trim().length >= 2;
    if (step === 5) return previewSlug.length >= 3 && slugStatus === "available";
    if (step === 6) return !!form.theme;
    if (step === 7) return !!form.plan;
    return true;
  }

  async function goNext() {
    // Save progress after the answer steps so onboarding can be resumed.
    if (step <= 3) saveIntent();
    setStep((s) => s + 1);
  }

  async function finish() {
    setLoading(true);
    setError("");
    await saveIntent();

    // 1) Create the company (tenant). Idempotent — returns existing if any.
    await fetch("/api/org", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.companyName || form.name,
        phone: form.companyPhone || undefined,
        gstin: form.gstin || undefined,
        website: form.website || undefined,
        addressLine1: form.addressLine1 || undefined,
        city: form.city || undefined,
        state: form.state || undefined,
        pincode: form.pincode || undefined,
        onboarding: intent,
      }),
    }).catch(() => {});

    // 2) Create the first store inside that company.
    const res = await fetch("/api/stores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        slug: previewSlug,
        industry: form.industry,
        theme: form.theme,
        plan: form.plan,
        customDomain: form.customDomain || undefined,
        companyName: form.companyName || form.name,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Could not create store");
      return;
    }
    setCreatedStore({ name: data.store.name, slug: data.store.slug });
    setStep(8);
    router.replace("/onboarding?launched=1");
    router.refresh();
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  if (step === 8 && createdStore) {
    return (
      <OnboardingShell userName={userName} step={8} totalSteps={TOTAL_STEPS} onLogout={logout}>
        <div style={{ textAlign: "center", padding: "24px 0 48px" }}>
          <div style={{ width: 72, height: 72, background: "#EEF2F8", border: "1px solid #E4E1DA", display: "grid", placeItems: "center", margin: "0 auto 20px", fontSize: 32 }}>
            ✦
          </div>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#24457A", margin: 0 }}>
            store launched
          </p>
          <h2 style={{ fontSize: 34, fontWeight: 700, letterSpacing: "-0.028em", lineHeight: 1.05, marginTop: 10 }}>
            you&apos;re live, {(userName || "merchant").toLowerCase()}.
          </h2>
          <p style={{ marginTop: 12, fontSize: 16, color: "#64748B", maxWidth: 520, margin: "12px auto 0", lineHeight: 1.6 }}>
            <strong>{createdStore.name}</strong> is ready with sample products and checkout.
          </p>
          <p style={{ marginTop: 8, fontSize: 14, color: "#94A3B8", display: "flex", gap: 8, alignItems: "center", justifyContent: "center" }}>
            <span style={{ width: 12, height: 12, border: "2px solid #CBD5E1", borderTopColor: "#24457A", borderRadius: "50%", animation: "ob-spin 0.8s linear infinite", display: "inline-block" }} />
            Taking you to your dashboard…
          </p>
          <div style={{ marginTop: 28, padding: "20px 24px", background: "#FAF9F6", border: "1px solid #E4E1DA", borderRadius: 0, display: "inline-block", textAlign: "left", minWidth: 280 }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: "#24457A" }}>
              your store URL
            </div>
            <a href={`/s/${createdStore.slug}`} target="_blank" rel="noreferrer" style={{ display: "block", marginTop: 8, fontWeight: 800, fontSize: 17, color: "#24457A", textDecoration: "none", fontFamily: "'JetBrains Mono', monospace" }}>
              {storeUrl(createdStore.slug)} ↗
            </a>
          </div>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 32, flexWrap: "wrap" }}>
            <Link href="/app" style={{ background: "#14161A", color: "#9FBBE0", padding: "14px 28px", fontWeight: 800, textDecoration: "none", border: "1px solid #E4E1DA" }}>
              go to dashboard →
            </Link>
            <Link href="/app/design" style={{ border: "1px solid #E4E1DA", padding: "14px 28px", fontWeight: 700, color: "#14161A", textDecoration: "none", borderRadius: 0, background: "#FAF9F6" }}>
              Open the editor
            </Link>
          </div>
        </div>
      </OnboardingShell>
    );
  }

  const stepTitles: Record<number, { title: string; subtitle: string }> = {
    1: {
      title: "let's get you a storefront.",
      subtitle: "you pay your plan's advance at the last step — everything you set up here is kept.",
    },
    2: {
      title: "what are you selling?",
      subtitle: "pick your main category. we'll suggest the right theme and sample products.",
    },
    3: {
      title: "tell us about your business.",
      subtitle: "this helps us tailor your dashboard and recommendations.",
    },
    4: {
      title: "what should we call your store?",
      subtitle: "you can change this anytime. use your brand name or legal company name.",
    },
    5: {
      title: "connect your domain.",
      subtitle: "we do not sell domains — bring the one you own (or buy it anywhere) and we connect it free on every plan: dns records, ssl and redirects.",
    },
    6: {
      title: "pick a starting theme.",
      subtitle: selectedCategory
        ? `recommended for ${selectedCategory.label.toLowerCase()} — you can change any of it later in the design editor.`
        : "you can change any of it later in the design editor — nothing here is permanent.",
    },
    7: {
      title: "choose how you pay.",
      subtitle: "you pay the advance today; the balance is invoiced once your store is live. the 2% sales fee only ever applies to completed orders, ex GST.",
    },
  };

  const meta = stepTitles[step];

  return (
    <OnboardingShell userName={userName} step={step} totalSteps={TOTAL_STEPS} onLogout={logout} onJump={(n) => setStep(n)}>
      <div className="onboarding-layout" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 320px", gap: 26, alignItems: "start" }}>
        <div key={step} className="onboarding-step-card" style={{ border: "1px solid #E4E1DA", background: "#FAF9F6", padding: 30, borderRadius: 0, boxShadow: "0 12px 28px rgba(20,22,26,0.10)" }}>
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 34, fontWeight: 700, letterSpacing: "-0.028em", lineHeight: 1.05, margin: 0 }}>
              {meta.title}
            </h2>
            <p style={{ marginTop: 10, fontSize: 15, lineHeight: 1.55, maxWidth: 520, color: "#14161A" }}>
              {meta.subtitle}
            </p>
          </div>
          {step === 1 && (
            <div style={{ display: "grid", gap: 10 }}>
              {ONBOARDING_GOALS.map((g) => (
                <ChoiceCard
                  key={g.id}
                  selected={intent.goal === g.id}
                  onClick={() => setIntent({ ...intent, goal: g.id })}
                  icon={g.icon}
                  title={g.title}
                  description={g.description}
                />
              ))}
            </div>
          )}

          {step === 2 && (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {SELLING_CATEGORIES.map((cat) => {
                const on = intent.category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => selectCategory(cat.id)}
                    style={{
                      border: "1px solid #E4E1DA",
                      background: on ? "#EEF2F8" : "#FAF9F6",
                      color: "#14161A",
                      padding: "9px 14px",
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {cat.label.toLowerCase()}
                  </button>
                );
              })}
            </div>
          )}

          {step === 3 && (
            <div style={{ display: "grid", gap: 24 }}>
              <div>
                <label style={labelStyle}>Where are you in your journey?</label>
                <div style={{ display: "grid", gap: 8 }}>
                  {BUSINESS_STAGES.map((s) => (
                    <ChoiceCard
                      key={s.id}
                      selected={intent.businessStage === s.id}
                      onClick={() => setIntent({ ...intent, businessStage: s.id })}
                      title={s.title}
                      description={s.description}
                      compact
                    />
                  ))}
                </div>
              </div>
              <div>
                <label style={labelStyle}>How do you sell today? <span style={{ fontWeight: 500, color: "#94A3B8" }}>(select all that apply)</span></label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {SALES_CHANNELS.map((ch) => (
                    <MultiChoiceChip
                      key={ch.id}
                      selected={intent.salesChannels.includes(ch.id)}
                      onClick={() => toggleChannel(ch.id)}
                      icon={ch.icon}
                      label={ch.label}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label style={labelStyle}>Monthly revenue <span style={{ fontWeight: 500, color: "#94A3B8" }}>(optional)</span></label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {REVENUE_RANGES.map((r) => (
                    <MultiChoiceChip
                      key={r.id}
                      selected={intent.revenueRange === r.id}
                      onClick={() => setIntent({ ...intent, revenueRange: r.id })}
                      label={r.label}
                    />
                  ))}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <div>
                  <label style={labelStyle}>Team size <span style={{ fontWeight: 500, color: "#94A3B8" }}>(optional)</span></label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {TEAM_SIZES.map((t) => (
                      <MultiChoiceChip key={t.id} selected={intent.teamSize === t.id} onClick={() => setIntent({ ...intent, teamSize: t.id })} label={t.label} />
                    ))}
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Expected orders <span style={{ fontWeight: 500, color: "#94A3B8" }}>(optional)</span></label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {MONTHLY_ORDERS.map((m) => (
                      <MultiChoiceChip key={m.id} selected={intent.monthlyOrders === m.id} onClick={() => setIntent({ ...intent, monthlyOrders: m.id })} label={m.label} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <>
              <label style={labelStyle}>Brand / store name <span style={{ color: "#DC2626" }}>*</span></label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Green Basket, Style Studio"
                style={inputStyle}
                autoFocus
              />
              <p style={{ marginTop: 6, fontSize: "0.8rem", color: "#94A3B8" }}>
                The name customers see on your storefront.
              </p>
              <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid #E4E1DA" }}>
                <label style={labelStyle}>Company / legal business name <span style={{ color: "#DC2626" }}>*</span></label>
                <input
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  placeholder="e.g. Green Basket Retail Pvt Ltd"
                  style={inputStyle}
                />
                <p style={{ marginTop: 6, fontSize: "0.8rem", color: "#94A3B8" }}>
                  Your registered company — this can be different from your brand name. It creates your
                  company workspace; you can add teammates and more stores under it later.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
                  <div>
                    <label style={labelStyle}>Phone <span style={{ fontWeight: 500, color: "#94A3B8" }}>(optional)</span></label>
                    <input value={form.companyPhone} onChange={(e) => setForm({ ...form, companyPhone: e.target.value })} placeholder="+91…" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>GSTIN <span style={{ fontWeight: 500, color: "#94A3B8" }}>(optional)</span></label>
                    <input value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value })} placeholder="22AAAAA0000A1Z5" style={inputStyle} />
                  </div>
                </div>
                <div style={{ marginTop: 12 }}>
                  <label style={labelStyle}>Business type <span style={{ fontWeight: 500, color: "#94A3B8" }}>(optional)</span></label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {BUSINESS_TYPES.map((b) => (
                      <MultiChoiceChip key={b.id} selected={intent.businessType === b.id} onClick={() => setIntent({ ...intent, businessType: b.id })} label={b.label} />
                    ))}
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10, marginTop: 12 }}>
                  <div>
                    <label style={labelStyle}>Address <span style={{ fontWeight: 500, color: "#94A3B8" }}>(optional)</span></label>
                    <input value={form.addressLine1} onChange={(e) => setForm({ ...form, addressLine1: e.target.value })} placeholder="Street, area" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>City</label>
                    <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Bengaluru" style={inputStyle} />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: 10, marginTop: 10 }}>
                  <div>
                    <label style={labelStyle}>State</label>
                    <input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} placeholder="KA" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Pincode</label>
                    <input value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} placeholder="560001" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Website</label>
                    <input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="yourbrand.in" style={inputStyle} />
                  </div>
                </div>
              </div>
              {selectedCategory && (
                <p style={{ marginTop: 12, fontSize: "0.85rem", color: "#64748B" }}>
                  Selling <strong>{selectedCategory.label.toLowerCase()}</strong> — we&apos;ll set up sample products for you.
                </p>
              )}
            </>
          )}

          {step === 5 && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 0, border: "1px solid #E4E1DA", background: "#FFFFFF" }}>
                <input
                  value={form.customDomain}
                  onChange={(e) => setForm({ ...form, customDomain: e.target.value })}
                  placeholder="yourbrand.in"
                  style={{ border: 0, outline: "none", padding: 14, fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", background: "transparent" }}
                  autoFocus
                />
                <div style={{ borderLeft: "1px solid #E4E1DA", background: "#EEF2F8", padding: "14px 18px", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", display: "flex", alignItems: "center", whiteSpace: "nowrap" }}>
                  connect it
                </div>
              </div>
              <div style={{ display: "grid", gap: 8, marginTop: 14 }}>
                {[
                  ["dns records set and maintained", "included"],
                  ["ssl certificate & https binding", "automated"],
                  ["www and https redirects", "included"],
                ].map(([left, right]) => (
                  <div key={left} style={{ border: "1px solid #E4E1DA", background: "#FAF9F6", padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                    <span style={{ fontSize: 14, fontWeight: 700 }}>{left}</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#2F6B4F" }}>{right}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 20, border: "2px dashed #14161A", padding: 16, fontSize: 14, lineHeight: 1.5 }}>
                no domain yet? buy one at any registrar in your own name — godaddy, cloudflare, hostinger — then paste it above. pointing it at us takes about 30 minutes with zero downtime.
              </div>
              <div style={{ marginTop: 22, paddingTop: 18, borderTop: "1px solid #E4E1DA" }}>
                <label style={labelStyle}>your supershowroom url</label>
                <div style={{ display: "flex", border: "1px solid #E4E1DA", background: "#FFFFFF", overflow: "hidden" }}>
                  <span style={{ padding: "12px 12px", fontSize: 13, color: "#64748B", borderRight: "1px solid #E4E1DA", whiteSpace: "nowrap", fontFamily: "'JetBrains Mono', monospace" }}>/s/</span>
                  <input
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    placeholder={slugify(form.name) || "your-store"}
                    style={{ ...inputStyle, border: 0, flex: 1 }}
                  />
                </div>
                <div style={{ marginTop: 8, fontSize: 13, fontWeight: 700, color: slugStatus === "available" ? "#2F6B4F" : slugStatus === "taken" ? "#DC2626" : "#64748B" }}>
                  {slugStatus === "checking" && "checking availability..."}
                  {slugStatus === "available" && `✦ ${previewSlug} is available`}
                  {slugStatus === "taken" && "this url is already taken"}
                  {slugStatus === "invalid" && "url must be at least 3 characters"}
                  {slugStatus === "idle" && previewSlug.length >= 3 && "we'll check availability when you continue"}
                </div>
              </div>
            </>
          )}

          {step === 6 && (
            <div className="onboarding-theme-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {THEMES.map((t) => {
                const on = form.theme === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setForm({ ...form, theme: t.key })}
                    style={{
                      border: "1px solid #E4E1DA",
                      background: on ? "#EEF2F8" : "#FAF9F6",
                      boxShadow: on ? "0 10px 24px rgba(20,22,26,0.10)" : "none",
                      cursor: "pointer",
                      display: "grid",
                      gridTemplateColumns: "62px 1fr",
                      gap: 12,
                      alignItems: "center",
                      padding: 12,
                      textAlign: "left",
                    }}
                  >
                    <div style={{ width: 62, height: 62, border: "1px solid #E4E1DA", overflow: "hidden" }}>
                      <img src={t.hero} alt={t.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 800, lineHeight: 1.15 }}>{t.name.toLowerCase()}</div>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 5, color: "#24457A" }}>
                        {on ? "selected ✦" : t.key === selectedCategory?.theme ? "recommended" : "preview"}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {step === 7 && (
            <div style={{ display: "grid", gap: 10 }}>
              {(["free", "essential", "pro", "elite", "plus"] as const).map((key) => {
                const plan = PLANS[key];
                const on = form.plan === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setForm({ ...form, plan: key })}
                    style={{
                      border: "1px solid #E4E1DA",
                      background: on ? "#24457A" : "#FAF9F6",
                      color: on ? "#FFFFFF" : "#14161A",
                      padding: 18,
                      display: "grid",
                      gridTemplateColumns: "1fr auto auto",
                      gap: 18,
                      alignItems: "center",
                      cursor: "pointer",
                      textAlign: "left",
                      boxShadow: on ? "0 10px 24px rgba(20,22,26,0.10)" : "none",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: "-0.03em" }}>{plan.name.toLowerCase()}</div>
                      <div style={{ fontSize: 13, marginTop: 3, opacity: 0.8 }}>{plan.tagline.toLowerCase()}</div>
                    </div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                      {plan.feePercent}% of sales
                    </div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 700, whiteSpace: "nowrap" }}>
                      {plan.price === 0 ? "free" : `₹${plan.price.toLocaleString("en-IN")}`}
                    </div>
                  </button>
                );
              })}
              <div style={{ marginTop: 8, paddingTop: 14, borderTop: "1px solid #E4E1DA" }}>
                <label style={labelStyle}>How did you hear about us? <span style={{ fontWeight: 500, color: "#94A3B8" }}>(optional)</span></label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {HEARD_FROM.map((h) => (
                    <MultiChoiceChip key={h.id} selected={intent.heardFrom === h.id} onClick={() => setIntent({ ...intent, heardFrom: h.id })} label={h.label} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {error && (
            <div style={{ marginTop: 16, background: "#FEF2F2", border: "1px solid #FECACA", color: "#B91C1C", padding: 12, borderRadius: 0, fontSize: "0.9rem" }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginTop: 30, paddingTop: 20, borderTop: "1px solid #E4E1DA" }}>
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1}
              style={{
                background: "none",
                border: 0,
                cursor: step === 1 ? "default" : "pointer",
                opacity: step === 1 ? 0.35 : 0.7,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#14161A",
              }}
            >
              ← back
            </button>
            {step < 7 ? (
              <button
                type="button"
                disabled={!canContinue()}
                onClick={goNext}
                style={{
                  ...btnPrimary,
                  opacity: canContinue() ? 1 : 0.45,
                  cursor: canContinue() ? "pointer" : "not-allowed",
                }}
              >
                continue →
              </button>
            ) : (
              <button type="button" onClick={finish} disabled={loading || !canContinue()} style={{ ...btnPrimary, opacity: loading ? 0.7 : 1 }}>
                {loading ? "launching your store..." : "launch my store →"}
              </button>
            )}
          </div>
        </div>

        <aside className="onboarding-preview" style={{ border: "1px solid #E4E1DA", background: "#14161A", color: "#FAF9F6", padding: 22, position: "sticky", top: 88 }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "#9FBBE0", letterSpacing: "0.18em", textTransform: "uppercase" }}>
            what happens next
          </div>
          <ul style={{ display: "grid", gap: 14, marginTop: 16, fontSize: 14, lineHeight: 1.5, listStyle: "none", padding: 0, marginBottom: 0 }}>
            <li>✦ your store goes live on a supershowroom subdomain immediately</li>
            <li>✦ we point your domain and issue its ssl within the hour</li>
            <li>✦ send us your catalog sheet — we upload the first 50 products for you</li>
            <li>✦ razorpay, UPI and COD get configured on a 15-min whatsapp call</li>
            <li>✦ advance clears — your store goes live the same day</li>
          </ul>
          {(form.name || selectedCategory) && (
            <div style={{ borderTop: "1px solid rgba(250,249,246,0.24)", marginTop: 20, paddingTop: 16, fontSize: 13, lineHeight: 1.6, opacity: 0.85 }}>
              {form.name ? <div style={{ fontWeight: 800 }}>{form.name}</div> : null}
              {selectedCategory ? <div style={{ marginTop: 4, opacity: 0.8 }}>{selectedCategory.label.toLowerCase()}</div> : null}
              <div style={{ marginTop: 6, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, wordBreak: "break-all", color: "#9FBBE0" }}>{previewUrl}</div>
            </div>
          )}
          <div style={{ borderTop: "1px solid rgba(250,249,246,0.24)", marginTop: 20, paddingTop: 16, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, lineHeight: 1.7, opacity: 0.75 }}>
            questions? whatsapp
            <br />
            +91 89684 30834
          </div>
        </aside>
      </div>
    </OnboardingShell>
  );
}

function OnboardingShell({
  children,
  userName,
  step,
  totalSteps,
  onLogout,
  onJump,
}: {
  children: React.ReactNode;
  userName: string;
  step: number;
  totalSteps: number;
  onLogout: () => void;
  onJump?: (n: number) => void;
}) {
  const todayLabel = new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
  const initial = (userName || "s").charAt(0).toLowerCase();

  return (
    <div style={{ minHeight: "100vh", background: "#F1EFE9", color: "#14161A", fontFamily: "'Instrument Sans', system-ui, sans-serif" }}>
      <style>{`
        .onboarding-step-card { animation: ob-fade 0.28s ease; }
        @keyframes ob-fade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        @keyframes ob-spin { to { transform: rotate(360deg); } }
        @media (max-width: 920px) {
          .onboarding-layout { grid-template-columns: 1fr !important; }
          .onboarding-preview { position: static !important; }
          .onboarding-theme-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <header style={{ background: "#FAF9F6", borderBottom: "1px solid #E4E1DA", padding: "16px 30px", display: "flex", alignItems: "center", gap: 20, position: "sticky", top: 0, zIndex: 40 }}>
        <div>
          <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "#24457A" }}>
              getting started
            </div>
            <h1 style={{ fontSize: 25, fontWeight: 700, letterSpacing: "-0.025em", margin: "2px 0 0", lineHeight: 1.1 }}>
              create your store
            </h1>
          </Link>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ border: "1px solid #E4E1DA", background: "#EEF2F8", padding: "9px 12px", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700 }}>
            {todayLabel}
          </div>
          <button
            type="button"
            onClick={onLogout}
            title="log out"
            style={{ width: 38, height: 38, border: "1px solid #24457A", background: "#24457A", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 15, cursor: "pointer" }}
          >
            {initial}
          </button>
        </div>
      </header>

      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "34px 30px 60px" }}>
        {step <= totalSteps && (
          <div style={{ display: "flex", gap: 8, marginBottom: 28, overflowX: "auto" }}>
            {ONBOARDING_STEPS.map((s) => {
              const on = step === s.id;
              const done = step > s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onJump?.(s.id)}
                  style={{
                    flex: 1,
                    minWidth: 92,
                    border: "1px solid #E4E1DA",
                    background: on ? "#14161A" : done ? "#EEF2F8" : "#FAF9F6",
                    color: on ? "#EEF2F8" : "#14161A",
                    padding: "12px 14px",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", opacity: 0.75 }}>
                    step {s.n}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 800, marginTop: 3 }}>{s.label}</div>
                </button>
              );
            })}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  display: "block",
  marginBottom: 8,
  color: "#475569",
};
const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  border: "1px solid #E4E1DA",
  borderRadius: 0,
  fontSize: 15,
  fontWeight: 600,
  background: "#FFFFFF",
  outline: "none",
};
const btnPrimary: React.CSSProperties = {
  background: "#14161A",
  color: "#9FBBE0",
  border: "1px solid #E4E1DA",
  padding: "11px 20px",
  fontWeight: 800,
  cursor: "pointer",
  borderRadius: 0,
  fontSize: 14,
};
