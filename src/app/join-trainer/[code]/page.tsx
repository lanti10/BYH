import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/i18n/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Image from "next/image";
import { Dumbbell, TrendingUp } from "lucide-react";

export default async function JoinTrainerPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code: rawCode } = await params;
  const code = rawCode.trim().toUpperCase();

  const { t } = await getT();
  const inviter = await prisma.trainerProfile.findUnique({
    where: { referralCode: code },
    include: { user: true },
  });

  async function accept() {
    "use server";
    const cookieStore = await cookies();
    cookieStore.set("byh_ref_trainer", code, {
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    redirect(`/sign-up?reft=${code}`);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-depth-dark p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center gap-3 mb-6">
          <div className="relative h-16 w-16 rounded-2xl overflow-hidden shadow-2xl ring-4 ring-white/10">
            <Image src="/byh-logo.jpg" alt="BYH" fill className="object-cover" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wide">BUILD YOUR HEALTH</h1>
        </div>

        <div className="rounded-3xl bg-white p-7 shadow-2xl text-center space-y-5">
          {inviter ? (
            <>
              <div className="flex flex-col items-center gap-3">
                {inviter.user.avatarUrl ? (
                  <div className="relative h-20 w-20 rounded-full overflow-hidden ring-4 ring-slate-100">
                    <Image src={inviter.user.avatarUrl} alt={inviter.user.name} fill className="object-cover" />
                  </div>
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
                    <Dumbbell className="h-9 w-9 text-slate-700" />
                  </div>
                )}
                <div>
                  <p className="text-sm text-slate-400">{t("jt.from")}</p>
                  <p className="text-xl font-bold text-slate-900">{inviter.user.name || t("jt.fallback")}</p>
                </div>
              </div>

              <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4 flex items-start gap-3 text-left">
                <TrendingUp className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-sm text-emerald-800">
                  {t("jt.banner")}
                </p>
              </div>

              <form action={accept}>
                <button
                  type="submit"
                  className="w-full rounded-2xl bg-slate-900 py-3.5 font-semibold text-white transition-colors hover:bg-slate-700"
                >
                  {t("jt.cta")}
                </button>
              </form>

              <p className="text-xs text-slate-400">
                {t("jn.code")}: <span className="font-bold tracking-widest text-slate-600">{code}</span>
              </p>
            </>
          ) : (
            <>
              <p className="text-lg font-semibold text-slate-800">{t("jn.invalid")}</p>
              <p className="text-slate-500 text-sm">
                {t("jn.invalidSub", { code })}
              </p>
              <a href="/sign-up" className="inline-block w-full rounded-2xl bg-slate-900 py-3 font-semibold text-white">
                {t("jn.anyway")}
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
