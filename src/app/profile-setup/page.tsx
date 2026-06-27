import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ProfileSetupForm } from "./profile-setup-form";

export default async function ProfileSetupPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  // Solo i clienti collegati a un trainer compilano questo profilo
  if (user.role !== "CLIENT" || !user.clientProfile) redirect("/");
  if (user.clientProfile.profileCompleted) redirect("/client");

  return <ProfileSetupForm firstName={user.name.split(" ")[0] || "atleta"} />;
}
