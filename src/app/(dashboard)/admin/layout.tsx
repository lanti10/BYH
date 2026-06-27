import { requireRole } from "@/lib/auth";
import { DashboardShell } from "@/components/shared/dashboard-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("ADMIN");

  return <DashboardShell role="admin">{children}</DashboardShell>;
}
