import { redirect } from "next/navigation";
import { getCurrentStore } from "@/lib/auth";
import { AppShell } from "@/components/app/AppShell";
import { ProjectsClient } from "@/components/app/ProjectsClient";

export default async function ProjectsPage() {
  const store = await getCurrentStore();
  if (!store) redirect("/onboarding");

  return (
    <AppShell store={store} crumb="account" title="projects" activePath="/app/projects">
      <ProjectsClient />
    </AppShell>
  );
}
