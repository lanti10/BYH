import { requireRole } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/shared/dashboard-shell";

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole("CLIENT");

  // Se collegato a un trainer ma profilo non ancora compilato → setup
  if (user.clientProfile && !user.clientProfile.profileCompleted) {
    redirect("/profile-setup");
  }

  return <DashboardShell role="client">{children}</DashboardShell>;
}
