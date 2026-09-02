import { redirect } from "next/navigation";

export const metadata = {
  title: "Pricing — SuperShowroom",
  description: "Choose a SuperShowroom plan.",
};

export default function DomainsPage() {
  redirect("/pricing");
}
