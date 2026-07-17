import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

// L'allenamento non è più una pagina: vive come overlay dentro l'app
// (vedi workout-session-provider.tsx), così abbassando la tendina si rivede
// subito la schermata di partenza invece di dover ricaricare.
// Questa rotta resta solo per non rompere link o schede aperte sul vecchio URL:
// riporta nell'app, dove la sessione in corso viene ripresa da sola.
export default async function WorkoutSessionRedirect() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  redirect(user.role === "TRAINER" ? "/trainer/my-workout" : "/client");
}
