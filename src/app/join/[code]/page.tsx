import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Image from "next/image";
import { Dumbbell } from "lucide-react";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code: rawCode } = await params;
  const code = rawCode.trim().toUpperCase();

  const trainer = await prisma.trainerProfile.findUnique({
    where: { referralCode: code },
    include: { user: true },
  });

  async function accept() {
    "use server";
    const cookieStore = await cookies();
    cookieStore.set("byh_ref", code, {
      maxAge: 60 * 60 * 24 * 7, // 7 giorni
      path: "/",
    });
    redirect(`/sign-up?ref=${code}`);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#D42B27] to-[#a81f1c] p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center gap-3 mb-6">
          <div className="relative h-16 w-16 rounded-2xl overflow-hidden shadow-2xl ring-4 ring-white/20">
            <Image src="/byh-logo.jpg" alt="BYH" fill className="object-cover" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-wide">BUILD YOUR HEALTH</h1>
        </div>

        <div className="rounded-3xl bg-white p-7 shadow-2xl text-center space-y-5">
          {trainer ? (
            <>
              <div className="flex flex-col items-center gap-3">
                {trainer.user.avatarUrl ? (
                  <div className="relative h-20 w-20 rounded-full overflow-hidden ring-4 ring-[#D42B27]/10">
                    <Image src={trainer.user.avatarUrl} alt={trainer.user.name} fill className="object-cover" />
                  </div>
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#D42B27]/10">
                    <Dumbbell className="h-9 w-9 text-[#D42B27]" />
                  </div>
                )}
                <div>
                  <p className="text-sm text-slate-400">Sei stato invitato da</p>
                  <p className="text-xl font-bold text-slate-900">{trainer.user.name || "il tuo trainer"}</p>
                </div>
              </div>

              <p className="text-slate-500 text-sm">
                Crea il tuo account per ricevere schede di allenamento personalizzate, seguire i tuoi progressi e restare in contatto con il tuo trainer.
              </p>

              <form action={accept}>
                <button
                  type="submit"
                  className="w-full rounded-2xl bg-emerald-600 py-3.5 font-semibold text-white transition-colors hover:bg-emerald-700"
                >
                  Crea il mio account
                </button>
              </form>

              <p className="text-xs text-slate-400">
                Codice invito: <span className="font-bold tracking-widest text-slate-600">{code}</span>
              </p>
            </>
          ) : (
            <>
              <p className="text-lg font-semibold text-slate-800">Codice non valido</p>
              <p className="text-slate-500 text-sm">
                Il link d&apos;invito <span className="font-bold">{code}</span> non corrisponde a nessun trainer. Controlla il link ricevuto.
              </p>
              <a
                href="/sign-up"
                className="inline-block w-full rounded-2xl bg-slate-900 py-3 font-semibold text-white"
              >
                Registrati comunque
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
