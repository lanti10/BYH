import { requireRole } from "@/lib/auth";
import { DashboardShell } from "@/components/shared/dashboard-shell";

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("CLIENT");

  return <DashboardShell role="client">{children}</DashboardShell>;
}
