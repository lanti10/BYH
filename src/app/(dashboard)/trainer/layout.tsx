import { requireRole } from "@/lib/auth";
import { SidebarNav } from "@/components/shared/sidebar-nav";

export default async function TrainerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("TRAINER");

  return (
    <div className="flex h-screen">
      <SidebarNav role="trainer" />
      <main className="flex-1 ml-64 overflow-y-auto bg-slate-50">
        {children}
      </main>
    </div>
  );
}
