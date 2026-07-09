import { redirect } from "next/navigation";

// Fuori scope v1 (commerce, Fase 2) — redirect per non lasciare dead-end.
// Vedi src/lib/scope.ts. Per riattivare: ripristina la vista e togli l'href da DISABLED_HREFS.
export default function Page() {
  redirect("/trainer");
}
