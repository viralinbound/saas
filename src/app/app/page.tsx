import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getDashboardShell } from "@/lib/auth";
import { AppShell } from "@/components/app/AppShell";
import { DashboardBody, DashboardSkeleton } from "@/components/app/DashboardBody";

/*
 * Dashboard — the "overview" screen from SuperShowroom App.dc.html#dashboard.
 * The shell (sidebar, header, greeting) renders from a light COUNT-only query
 * so it paints immediately; the stat cards + 14-day chart + order feed stream
 * in behind <Suspense> once the full store loads. Same numbers, same logic.
 */
export default async function DashboardPage() {
  const shell = await getDashboardShell();
  if (!shell) redirect("/onboarding");

  const today = new Date();
  const istHour = new Date(Date.now() + 5.5 * 3600 * 1000).getUTCHours();
  const greeting = istHour < 12 ? "Good morning" : istHour < 17 ? "Good afternoon" : istHour < 21 ? "Good evening" : "Good night";
  const fullName = String(shell.owner.name || "there")
    .trim()
    .split(/\s+/)
    .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return (
    <AppShell
      store={{ ...shell, products: [], orders: [] }}
      crumb={`overview · ${today.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}`}
      title={`${greeting}, ${fullName}`}
    >
      <div style={{ display: "grid", gap: 20 }}>
        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardBody />
        </Suspense>
      </div>
    </AppShell>
  );
}
