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
          <div style={{ width: 72, height: 72, background: "#EEF2F8", display: "grid", placeItems: "center", margin: "0 auto 20px", fontSize: 32 }}>
            🎉
          </div>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#24457A", margin: 0 }}>
            store launched
          </p>
          <h2 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "clamp(2rem, 4.4vw, 2.6rem)", fontWeight: 400, letterSpacing: "-0.02em", marginTop: 10 }}>
            You&apos;re live, {userName || "merchant"}!
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
            <Link href="/app" style={{ background: "#24457A", color: "#fff", padding: "14px 28px", fontWeight: 700, textDecoration: "none", borderRadius: 0 }}>
              Go to dashboard →
            </Link>
            <Link href="/app/design" style={{ border: "1px solid #E4E1DA", padding: "14px 28px", fontWeight: 700, color: "#14161A", textDecoration: "none", borderRadius: 0, background: "#FAF9F6" }}>
              Open the editor
            </Link>
          </div>
        </div>
      </OnboardingShell>
    );
  }

  const stepTitles: Record<number, { kicker: string; title: string; subtitle: string }> = {
    1: {
      kicker: "Step 1 of 7",
      title: "What brings you to SuperShowroom?",
      subtitle: "We'll personalize your setup based on your goals — just like Shopify.",
    },
    2: {
      kicker: "Step 2 of 7",
      title: "What do you plan to sell?",
      subtitle: "Pick your main category. We'll suggest the right theme and sample products.",
    },
    3: {
      kicker: "Step 3 of 7",
      title: "Tell us about your business",
      subtitle: "This helps us tailor your dashboard and recommendations.",
    },
    4: {
      kicker: "Step 4 of 7",
      title: "What should we call your store?",
      subtitle: "You can change this anytime. Use your brand name or business name.",
    },
    5: {
      kicker: "Step 5 of 7",
      title: "Choose your store address",
      subtitle: "This is the URL customers will visit. Keep it short and memorable.",
    },
    6: {
      kicker: "Step 6 of 7",
      title: "Pick a storefront theme",
      subtitle: selectedCategory ? `Recommended for ${selectedCategory.label.toLowerCase()}` : "Choose a look that matches your brand.",
    },
    7: {
      kicker: "Step 7 of 7",
      title: "Select your plan",
      subtitle: "Start free today. Upgrade when you're ready to grow.",
    },
  };

  const meta = stepTitles[step];

  return (
    <OnboardingShell userName={userName} step={step} totalSteps={TOTAL_STEPS} onLogout={logout}>
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "#24457A", margin: 0 }}>
          {userName ? `Welcome, ${userName} · ` : ""}{meta.kicker}
        </p>
        <h2 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "clamp(1.9rem, 3.6vw, 2.4rem)", fontWeight: 400, marginTop: 8, letterSpacing: "-0.02em", lineHeight: 1.05 }}>
          {meta.title}
        </h2>
        <p style={{ marginTop: 8, color: "#64748B", fontSize: "0.95rem", lineHeight: 1.5, maxWidth: 560 }}>
          {meta.subtitle}
        </p>
      </div>

      <div className="onboarding-layout" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(260px, 300px)", gap: 24, alignItems: "start" }}>
        <div key={step} className="onboarding-step-card" style={{ border: "1px solid #E4E1DA", background: "#FAF9F6", padding: "28px 28px 24px", borderRadius: 0, boxShadow: "0 12px 28px rgba(20,22,26,0.10)" }}>
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
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
              {SELLING_CATEGORIES.map((cat) => (
                <ChoiceCard
                  key={cat.id}
                  selected={intent.category === cat.id}
                  onClick={() => selectCategory(cat.id)}
                  icon={cat.icon}
                  title={cat.label}
                  compact
                />
              ))}
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
              <label style={labelStyle}>Store URL</label>
              <div style={{ display: "flex", border: "1px solid #E4E1DA", background: "#FFFFFF", borderRadius: 0, overflow: "hidden" }}>
                <span style={{ padding: "12px 12px", fontSize: 13, color: "#64748B", borderRight: "1px solid #E4E1DA", whiteSpace: "nowrap", fontFamily: "'JetBrains Mono', monospace" }}>/s/</span>
                <input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder={slugify(form.name) || "your-store"}
                  style={{ ...inputStyle, border: 0, borderRadius: 0, flex: 1 }}
                  autoFocus
                />
              </div>
              <div style={{ marginTop: 8, fontSize: 13, fontWeight: 700, color: slugStatus === "available" ? "#16A34A" : slugStatus === "taken" ? "#DC2626" : "#64748B" }}>
                {slugStatus === "checking" && "Checking availability..."}
                {slugStatus === "available" && `✓ ${previewSlug} is available`}
                {slugStatus === "taken" && "✗ This URL is already taken"}
                {slugStatus === "invalid" && "✗ URL must be at least 3 characters"}
                {slugStatus === "idle" && previewSlug.length >= 3 && "We'll check availability when you continue"}
              </div>
              <label style={{ ...labelStyle, marginTop: 20 }}>
                Custom domain <span style={{ fontWeight: 500, color: "#94A3B8" }}>(optional)</span>
              </label>
              <input value={form.customDomain} onChange={(e) => setForm({ ...form, customDomain: e.target.value })} placeholder="yourbrand.in" style={inputStyle} />
            </>
          )}

          {step === 6 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12 }}>
              {THEMES.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setForm({ ...form, theme: t.key })}
                  style={{
                    border: `1px solid ${form.theme === t.key ? "#24457A" : "#E4E1DA"}`,
                    background: form.theme === t.key ? "#EEF2F8" : "#FFFFFF",
                    padding: 8,
                    textAlign: "left",
                    cursor: "pointer",
                    borderRadius: 0,
                  }}
                >
                  <img src={t.hero} alt={t.name} style={{ width: "100%", height: 72, objectFit: "cover", marginBottom: 8 }} />
                  <div style={{ fontWeight: 800, fontSize: 12, lineHeight: 1.3 }}>{t.name}</div>
                  {t.key === selectedCategory?.theme && (
                    <div style={{ fontSize: 10, color: "#24457A", fontWeight: 700, marginTop: 4 }}>Recommended</div>
                  )}
                </button>
              ))}
            </div>
          )}

          {step === 7 && (
            <div style={{ display: "grid", gap: 10 }}>
              {(["free", "essential", "pro", "elite"] as const).map((key) => {
                const plan = PLANS[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setForm({ ...form, plan: key })}
                    style={{
                      border: `1px solid ${form.plan === key ? "#24457A" : "#E4E1DA"}`,
                      background: form.plan === key ? "#24457A" : "#FFFFFF",
                      color: form.plan === key ? "#fff" : "#14161A",
                      padding: 16,
                      textAlign: "left",
                      cursor: "pointer",
                      borderRadius: 0,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 16 }}>
                          {plan.name}
                          {key === "free" && <span style={{ marginLeft: 8, fontSize: 11, opacity: 0.9 }}>✦ recommended</span>}
                        </div>
                        <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>{plan.tagline}</div>
                      </div>
                      <div style={{ fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", whiteSpace: "nowrap" }}>
                        {plan.price === 0 ? "Free" : `₹${(plan.price / 1000).toFixed(0)}k/yr`}
                      </div>
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

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 28, paddingTop: 20, borderTop: "1px solid #E4E1DA" }}>
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1}
              style={{ background: "none", border: 0, cursor: step === 1 ? "default" : "pointer", opacity: step === 1 ? 0.3 : 1, fontWeight: 700, color: "#475569", fontSize: "0.9rem" }}
            >
              ← Back
            </button>
            {step < 7 ? (
              <button type="button" disabled={!canContinue()} onClick={goNext} style={{ ...btnPrimary, opacity: canContinue() ? 1 : 0.45, cursor: canContinue() ? "pointer" : "not-allowed" }}>
                Continue →
              </button>
            ) : (
              <button type="button" onClick={finish} disabled={loading || !canContinue()} style={{ ...btnPrimary, opacity: loading ? 0.7 : 1 }}>
                {loading ? "Launching your store..." : "Launch my store →"}
              </button>
            )}
          </div>
        </div>

        <aside className="onboarding-preview" style={{ border: "1px solid #E4E1DA", background: "#14161A", color: "#FAF9F6", padding: 22, borderRadius: 0, position: "sticky", top: 120 }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "#9FBBE0", letterSpacing: "0.16em", textTransform: "uppercase" }}>
            your store preview
          </div>
          <div style={{ marginTop: 14, fontWeight: 800, fontSize: 18 }}>{form.name || "Your Store"}</div>
          <div style={{ marginTop: 6, fontSize: 12, wordBreak: "break-all", color: "#CBD5E1" }}>{previewUrl}</div>

          {intent.goal && (
            <div style={{ marginTop: 16, padding: "10px 12px", background: "rgba(255,255,255,0.06)", fontSize: 12, color: "#CBD5E1" }}>
              <span style={{ color: "#9FBBE0", fontWeight: 700 }}>Goal · </span>
              {ONBOARDING_GOALS.find((g) => g.id === intent.goal)?.title}
            </div>
          )}
          {selectedCategory && (
            <div style={{ marginTop: 8, padding: "10px 12px", background: "rgba(255,255,255,0.06)", fontSize: 12, color: "#CBD5E1" }}>
              <span style={{ color: "#9FBBE0", fontWeight: 700 }}>Category · </span>
              {selectedCategory.icon} {selectedCategory.label}
            </div>
          )}

          {form.companyName && (
            <div style={{ marginTop: 8, padding: "10px 12px", background: "rgba(255,255,255,0.06)", fontSize: 12, color: "#CBD5E1" }}>
              <span style={{ color: "#9FBBE0", fontWeight: 700 }}>Company · </span>
              {form.companyName}{form.city ? ` · ${form.city}` : ""}
            </div>
          )}
          <div style={{ marginTop: 8, padding: "10px 12px", background: "rgba(255,255,255,0.06)", fontSize: 12, color: "#CBD5E1" }}>
            <span style={{ color: "#9FBBE0", fontWeight: 700 }}>Plan · </span>
            {PLANS[form.plan]?.name || "Start Free"}{form.plan === "free" ? " (demo)" : ""}
          </div>

          {form.theme && (
            <img src={THEMES.find((t) => t.key === form.theme)?.hero} alt="" style={{ width: "100%", height: 96, objectFit: "cover", marginTop: 16 }} />
          )}

          <ul style={{ marginTop: 18, display: "grid", gap: 8, fontSize: 12, lineHeight: 1.5, color: "#94A3B8", paddingLeft: 16 }}>
            <li>Sample products on launch</li>
            <li>Cart &amp; checkout included</li>
            <li>Edit &amp; publish a demo instantly</li>
            <li>Full Shopify-style admin + live analytics</li>
          </ul>
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
}: {
  children: React.ReactNode;
  userName: string;
  step: number;
  totalSteps: number;
  onLogout: () => void;
}) {
  const progress = step >= totalSteps + 1 ? 100 : Math.round(((step - 1) / totalSteps) * 100);

  return (
    <div style={{ minHeight: "100vh", background: "#F1EFE9", color: "#14161A", fontFamily: "'Instrument Sans', system-ui, sans-serif" }}>
      <style>{`
        .onboarding-step-card { animation: ob-fade 0.28s ease; }
        @keyframes ob-fade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        @keyframes ob-spin { to { transform: rotate(360deg); } }
        @media (max-width: 860px) {
          .onboarding-layout { grid-template-columns: 1fr !important; }
          .onboarding-preview { position: static !important; order: -1; }
          .onboarding-header-meta { display: none !important; }
        }
      `}</style>
      <header style={{ background: "#14161A", color: "#FAF9F6", padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <div>
          <Link href="/" style={{ color: "#FAF9F6", textDecoration: "none" }}>
            <div style={{ fontSize: 20, fontWeight: 800 }}>supershowroom<span style={{ color: "#9FBBE0" }}>✦</span></div>
          </Link>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, letterSpacing: "0.2em", textTransform: "uppercase", color: "#9FBBE0" }}>
            store setup
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {step <= totalSteps && (
            <span style={{ fontSize: 12, color: "#9FBBE0", fontFamily: "'JetBrains Mono', monospace" }}>
              {Math.min(step, totalSteps)} / {totalSteps}
            </span>
          )}
          {userName && <span className="onboarding-header-meta" style={{ fontSize: 13, opacity: 0.85 }}>{userName}</span>}
          <button type="button" onClick={onLogout} style={{ background: "none", border: "1px solid rgba(255,255,255,0.2)", color: "#FAF9F6", padding: "6px 12px", fontSize: 12, cursor: "pointer", borderRadius: 0 }}>
            Log out
          </button>
        </div>
      </header>

      {step <= totalSteps && (
        <div style={{ background: "#FAF9F6", borderBottom: "1px solid #E4E1DA" }}>
          <div style={{ maxWidth: 1080, margin: "0 auto", padding: "14px 24px" }}>
            <div style={{ height: 4, background: "#E4E1DA", overflow: "hidden", marginBottom: 12 }}>
              <div style={{ height: "100%", width: `${progress}%`, background: "#24457A", transition: "width 0.3s ease" }} />
            </div>
            <div style={{ display: "flex", gap: 4, overflowX: "auto" }}>
              {ONBOARDING_STEPS.map((s) => (
                <div
                  key={s.id}
                  style={{
                    flex: "1 0 auto",
                    minWidth: 72,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 8,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: step >= s.id ? "#24457A" : "#94A3B8",
                    fontWeight: step === s.id ? 800 : 600,
                    textAlign: "center",
                  }}
                >
                  {s.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "32px 24px 60px" }}>{children}</div>
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
  background: "#24457A",
  color: "#fff",
  border: "1px solid #24457A",
  padding: "13px 24px",
  fontWeight: 700,
  cursor: "pointer",
  borderRadius: 0,
  fontSize: "0.92rem",
};
