import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  const { userId } = await auth();

  if (!userId) redirect("/sign-in");

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });

  if (!user) {
    // Crea utente base nel DB se non esiste ancora
    const { currentUser } = await import("@clerk/nextjs/server");
    const clerkUser = await currentUser();
    if (!clerkUser) redirect("/sign-in");
    redirect("/onboarding");
  }

  if (user.role === "ADMIN") redirect("/admin");
  if (user.role === "TRAINER") redirect("/trainer");
  redirect("/client");
}
