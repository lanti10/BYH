import { canAdmin, requireRole } from "@/lib/auth";
import { DashboardShell } from "@/components/shared/dashboard-shell";

export default async function TrainerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole("TRAINER");

  return (
    <DashboardShell role="trainer" canAdmin={canAdmin(user)}>
      {children}
    </DashboardShell>
  );
}
