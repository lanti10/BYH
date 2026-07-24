import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TrainerShopView } from "@/components/shop/trainer-shop-view";
import type { ShopProduct } from "@/lib/products";
import type { ShareClient } from "@/components/shop/share-product-sheet";

export default async function Page() {
  const me = await getCurrentUser();
  const trainerProfile = me?.trainerProfile ?? null;

  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
  const shopProducts: ShopProduct[] = products.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    imageUrl: p.imageUrl,
    category: p.category,
    price: p.salePrice,
    amazonUrl: p.amazonUrl ?? "",
  }));

  let picked: string[] = [];
  let clients: ShareClient[] = [];

  if (trainerProfile && me) {
    const [picks, clientProfiles] = await Promise.all([
      prisma.trainerProductPick.findMany({
        where: { trainerId: trainerProfile.id },
        select: { productId: true },
      }),
      prisma.clientProfile.findMany({
        // Esclude l'auto-cliente del PT (il PT è cliente di sé stesso per "Il mio allenamento")
        where: { trainerId: trainerProfile.id, userId: { not: me.id } },
        include: { user: { select: { id: true, name: true, avatarUrl: true } } },
        orderBy: { createdAt: "desc" },
      }),
    ]);
    picked = picks.map((p) => p.productId);
    clients = clientProfiles.map((c) => ({
      userId: c.user.id,
      name: c.user.name || "—",
      avatarUrl: c.user.avatarUrl,
    }));
  }

  return (
    <TrainerShopView
      products={shopProducts}
      initialPicked={picked}
      clients={clients}
      trainerSubtag={trainerProfile ? `t${trainerProfile.id}` : ""}
    />
  );
}
