import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ClientShopView } from "@/components/shop/client-shop-view";
import type { ShopProduct } from "@/lib/products";

export default async function Page() {
  const me = await getCurrentUser();

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

  const clientProfile = me?.clientProfile ?? null;

  // Lista consigliati del PT di questo cliente + nome del PT
  let recommended: Record<string, string | null> = {};
  let trainerName: string | null = null;
  if (clientProfile) {
    const [picks, trainer] = await Promise.all([
      prisma.trainerProductPick.findMany({ where: { trainerId: clientProfile.trainerId } }),
      prisma.trainerProfile.findUnique({
        where: { id: clientProfile.trainerId },
        include: { user: { select: { name: true } } },
      }),
    ]);
    recommended = Object.fromEntries(picks.map((p) => [p.productId, p.note]));
    trainerName = trainer?.user.name?.split(" ")[0] || null;
  }

  return (
    <ClientShopView
      products={shopProducts}
      recommended={recommended}
      trainerName={trainerName}
      subtag={clientProfile ? `c${clientProfile.id}` : ""}
      hasTrainer={!!clientProfile}
    />
  );
}
