"use client";

import { useT } from "@/lib/i18n/client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Dumbbell, Users, ArrowLeft, ArrowRight } from "lucide-react";
import Image from "next/image";

type Role = "TRAINER" | "CLIENT";
type Step = "role" | "code";

function OnboardingInner() {
  const { user } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();

  const { t } = useT();
  const [step, setStep] = useState<Step>("role");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState((searchParams.get("ref") ?? "").toUpperCase());

  async function submit(role: Role, referralCode?: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, referralCode }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push(data.redirect ?? (role === "TRAINER" ? "/trainer" : "/client"));
      } else {
        setError(data.error ?? "Qualcosa è andato storto.");
      }
    } catch {
      setError("Errore di connessione. Riprova.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-depth-dark p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-20 w-20 rounded-3xl overflow-hidden shadow-2xl ring-4 ring-white/20">
            <Image src="/byh-logo.jpg" alt="BYH" fill className="object-cover" />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white tracking-wide">BUILD YOUR HEALTH</h1>
            <p className="text-white/80 mt-1">
              {t("setup.hi", { name: user?.firstName ?? "" })} {step === "role" ? t("ob.q") : t("ob.codeQ")}
            </p>
          </div>
        </div>

        {step === "role" && (
          <div className="space-y-4">
            <button
              disabled={loading}
              onClick={() => submit("TRAINER")}
              className="w-full text-left rounded-3xl bg-white p-5 shadow-xl transition-transform hover:scale-[1.02] active:scale-[0.99] disabled:opacity-60"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10">
                  <Dumbbell className="h-6 w-6 text-brand" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-900">{t("ob.pt")}</p>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {t("ob.ptSub")}
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-slate-300" />
              </div>
            </button>

            <button
              disabled={loading}
              onClick={() => setStep("code")}
              className="w-full text-left rounded-3xl bg-white p-5 shadow-xl transition-transform hover:scale-[1.02] active:scale-[0.99] disabled:opacity-60"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10">
                  <Users className="h-6 w-6 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-900">{t("ob.cl")}</p>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {t("ob.clSub")}
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-slate-300" />
              </div>
            </button>
          </div>
        )}

        {step === "code" && (
          <div className="rounded-3xl bg-white p-6 shadow-xl space-y-5">
            <div>
              <label className="text-sm font-semibold text-slate-700">{t("ob.codeLabel")}</label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="ES. K7M2P9"
                maxLength={8}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-lg font-bold tracking-widest text-slate-900 uppercase outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
              <p className="mt-2 text-xs text-slate-400">
                {t("ob.codeHint")}
              </p>
            </div>

            {error && <p className="text-sm text-brand font-medium">{error}</p>}

            <button
              disabled={loading || code.trim().length < 5}
              onClick={() => submit("CLIENT", code.trim())}
              className="w-full rounded-full bg-brand py-3 font-semibold text-white shadow-cta transition-colors hover:bg-brand-hover disabled:opacity-50"
            >
              {loading ? t("nc.connecting") : t("ob.connect")}
            </button>

            <button
              disabled={loading}
              onClick={() => submit("CLIENT")}
              className="w-full text-sm font-medium text-slate-400 hover:text-slate-600"
            >
              {t("ob.skip")}
            </button>

            <button
              onClick={() => { setStep("role"); setError(null); }}
              className="flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-slate-600"
            >
              <ArrowLeft className="h-4 w-4" /> {t("common.back")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={null}>
      <OnboardingInner />
    </Suspense>
  );
}
