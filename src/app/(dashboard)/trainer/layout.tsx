import { requireRole } from "@/lib/auth";
import { DashboardShell } from "@/components/shared/dashboard-shell";

export default async function TrainerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("TRAINER");

  return <DashboardShell role="trainer">{children}</DashboardShell>;
}
