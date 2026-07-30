import { SignOutButton } from "@clerk/nextjs";

// Pagina per account sospesi dall'admin (User.suspended). Niente DashboardShell:
// chi arriva qui non deve vedere nav/menu, solo il messaggio e l'uscita.
export default function SuspendedPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-depth-light p-6">
      <div className="max-w-sm rounded-3xl glass p-8 text-center">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">Account sospeso</h1>
        <p className="mt-2 text-sm text-slate-500">
          Il tuo accesso a Build Your Health è stato sospeso. Se pensi sia un errore, contatta l&apos;assistenza.
        </p>
        <SignOutButton>
          <button className="mt-6 w-full rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white">
            Esci
          </button>
        </SignOutButton>
      </div>
    </div>
  );
}
