import { redirect } from "next/navigation";
import { getCurrentStore } from "@/lib/auth";
import { AppShell } from "@/components/app/AppShell";
import { OrdersClient } from "@/components/app/OrdersClient";

export default async function OrdersPage() {
  const store = await getCurrentStore();
  if (!store) redirect("/onboarding");

  return (
    <AppShell store={store} crumb="fulfilment" title="orders" activePath="/app/orders">
      <OrdersClient orders={store.orders} />
    </AppShell>
  );
}
