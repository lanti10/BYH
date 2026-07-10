"use client";

import { useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Mail, Pencil, X, Check, AlertCircle } from "lucide-react";
import { useT } from "@/lib/i18n/client";

// Blocco "Email" riutilizzabile: mostra l'email corrente e permette di cambiarla
// con verifica via codice (gestita da Clerk), poi allinea l'email nel DB tramite
// la server action `syncEmail`. Usato identico su profilo trainer e cliente.
export function EmailField({
  syncEmail,
}: {
  syncEmail: (email: string) => Promise<{ ok: boolean }>;
}) {
  const { user, isLoaded } = useUser();
  const { t } = useT();
  const router = useRouter();

  const [mode, setMode] = useState<"view" | "edit" | "verify">("view");
  const [newEmail, setNewEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err" | "info"; text: string } | null>(null);
  const pendingEmailId = useRef<string | null>(null);

  const email = user?.primaryEmailAddress?.emailAddress ?? "—";

  // 1) crea la nuova email su Clerk e invia il codice di verifica
  async function sendEmailCode() {
    if (!user) return;
    const target = newEmail.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(target)) {
      setMsg({ type: "err", text: t("acct.emailInvalid") });
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const ea = await user.createEmailAddress({ email: target });
      await ea.prepareVerification({ strategy: "email_code" });
      pendingEmailId.current = ea.id;
      setMode("verify");
      setMsg({ type: "info", text: t("acct.codeSent") });
    } catch {
      setMsg({ type: "err", text: t("acct.emailErr") });
    } finally {
      setBusy(false);
    }
  }

  // 2) verifica il codice, imposta come primaria e rimuove le vecchie email
  async function verifyEmailCode() {
    if (!user || !pendingEmailId.current) return;
    setBusy(true);
    setMsg(null);
    try {
      await user.reload();
      const ea = user.emailAddresses.find((e) => e.id === pendingEmailId.current);
      if (!ea) throw new Error("email non trovata");
      await ea.attemptVerification({ code: code.trim() });
      await user.update({ primaryEmailAddressId: ea.id });
      for (const other of user.emailAddresses) {
        if (other.id !== ea.id) {
          try {
            await other.destroy();
          } catch {
            /* ignora */
          }
        }
      }
      await user.reload();
      await syncEmail(ea.emailAddress);
      router.refresh();
      setMode("view");
      setNewEmail("");
      setCode("");
      pendingEmailId.current = null;
      setMsg({ type: "ok", text: t("acct.emailOk") });
    } catch {
      setMsg({ type: "err", text: t("acct.codeErr") });
    } finally {
      setBusy(false);
    }
  }

  function cancel() {
    setMode("view");
    setNewEmail("");
    setCode("");
    pendingEmailId.current = null;
    setMsg(null);
  }

  if (!isLoaded || !user) {
    return <div className="h-16 rounded-2xl bg-slate-50 animate-pulse" />;
  }

  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
          <Mail className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-slate-400">{t("pf.email")}</p>
          <p className="text-sm font-semibold text-slate-900 truncate">{email}</p>
        </div>
        {mode === "view" ? (
          <button
            onClick={() => {
              setMode("edit");
              setMsg(null);
            }}
            className="shrink-0 inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-brand hover:bg-slate-100"
          >
            <Pencil className="h-3 w-3" /> {t("acct.editEmail")}
          </button>
        ) : (
          <button
            onClick={cancel}
            className="shrink-0 rounded-full bg-white p-1.5 text-slate-400 hover:text-slate-700"
            aria-label={t("common.cancel")}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Passo 1: nuova email */}
      {mode === "edit" && (
        <div className="mt-3 space-y-2">
          <input
            type="email"
            inputMode="email"
            autoCapitalize="off"
            autoCorrect="off"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder={t("acct.newEmail")}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-base outline-none focus:border-brand"
          />
          <button
            onClick={sendEmailCode}
            disabled={busy}
            className="w-full rounded-full bg-brand py-2.5 text-sm font-semibold text-white shadow-cta hover:bg-brand-hover disabled:opacity-60"
          >
            {busy ? t("session.saving") : t("acct.sendCode")}
          </button>
        </div>
      )}

      {/* Passo 2: codice di verifica */}
      {mode === "verify" && (
        <div className="mt-3 space-y-2">
          <input
            inputMode="numeric"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={t("acct.code")}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-base tracking-widest outline-none focus:border-brand"
          />
          <button
            onClick={verifyEmailCode}
            disabled={busy}
            className="w-full rounded-full bg-brand py-2.5 text-sm font-semibold text-white shadow-cta hover:bg-brand-hover disabled:opacity-60"
          >
            {busy ? t("session.saving") : t("acct.verify")}
          </button>
        </div>
      )}

      {msg && (
        <p
          className={`mt-2 flex items-center gap-1.5 text-xs ${
            msg.type === "ok" ? "text-emerald-600" : msg.type === "err" ? "text-brand" : "text-slate-500"
          }`}
        >
          {msg.type === "ok" ? (
            <Check className="h-3.5 w-3.5" />
          ) : msg.type === "err" ? (
            <AlertCircle className="h-3.5 w-3.5" />
          ) : (
            <Mail className="h-3.5 w-3.5" />
          )}
          {msg.text}
        </p>
      )}
    </div>
  );
}
