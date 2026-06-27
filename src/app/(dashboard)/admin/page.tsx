import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ShoppingBag, TrendingUp, Package } from "lucide-react";

export default async function AdminDashboard() {
  await requireRole("ADMIN");

  const [trainerCount, clientCount, productCount, orderStats] = await Promise.all([
    prisma.trainerProfile.count(),
    prisma.clientProfile.count(),
    prisma.product.count({ where: { isActive: true } }),
    prisma.order.aggregate({
      _sum: { totalAmount: true },
      _count: { id: true },
    }),
  ]);

  const stats = [
    { label: "Trainer attivi", value: trainerCount, icon: Users, color: "text-blue-600" },
    { label: "Clienti totali", value: clientCount, icon: Users, color: "text-violet-600" },
    { label: "Prodotti attivi", value: productCount, icon: Package, color: "text-orange-600" },
    {
      label: "Fatturato totale",
      value: `€${(orderStats._sum.totalAmount ?? 0).toFixed(2)}`,
      icon: TrendingUp,
      color: "text-emerald-600",
    },
  ];

  return (
    <div className="p-4 sm:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Pannello Admin</h1>
        <p className="text-slate-500 mt-1">Panoramica della piattaforma BYH</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">{stat.label}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stat.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              Ordini recenti
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-400 text-center py-6">
              {orderStats._count.id} ordini totali
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Crescita rete
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-400 text-center py-6">
              {trainerCount} trainer nella rete
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
