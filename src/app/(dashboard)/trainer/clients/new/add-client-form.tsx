"use client";

import { useT } from "@/lib/i18n/client";

import { useActionState } from "react";
import { addClientByEmail, type AddClientState } from "./actions";
import { Check, AlertCircle } from "lucide-react";

const initial: AddClientState = {};

export function AddClientForm() {
  const { t } = useT();
  const [state, formAction, pending] = useActionState(addClientByEmail, initial);

  return (
    <form action={formAction} className="space-y-3">
      <input
        name="email"
        type="email"
        required
        placeholder="email@cliente.com"
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
      />
      <button
        disabled={pending}
        className="w-full rounded-2xl bg-slate-900 py-3 font-semibold text-white transition-colors hover:bg-slate-700 disabled:opacity-50"
      >
        {pending ? t("nc.connecting") : t("nc.connect")}
      </button>

      {state.error && (
        <p className="flex items-start gap-2 text-sm text-brand">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="flex items-start gap-2 text-sm text-emerald-600">
          <Check className="h-4 w-4 mt-0.5 shrink-0" />
          {state.success}
        </p>
      )}
    </form>
  );
}
