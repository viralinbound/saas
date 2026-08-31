import { redirect } from "next/navigation";
import { getCurrentStore } from "@/lib/auth";
import { AppShell } from "@/components/app/AppShell";
import { AccountClient } from "@/components/app/AccountClient";

export default async function AccountPage() {
  const store = await getCurrentStore();
  if (!store) redirect("/onboarding");

  return (
    <AppShell store={store} crumb="your profile" title="account & security" activePath="/app/account">
      <AccountClient />
    </AppShell>
  );
}
