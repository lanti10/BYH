import { requireRole } from "@/lib/auth";
import { SidebarNav } from "@/components/shared/sidebar-nav";

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("CLIENT");

  return (
    <div className="flex h-screen">
      <SidebarNav role="client" />
      <main className="flex-1 ml-64 overflow-y-auto bg-slate-50">
        {children}
      </main>
    </div>
  );
}
