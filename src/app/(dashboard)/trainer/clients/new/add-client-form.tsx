"use client";

import { useActionState } from "react";
import { addClientByEmail, type AddClientState } from "./actions";
import { Check, AlertCircle } from "lucide-react";

const initial: AddClientState = {};

export function AddClientForm() {
  const [state, formAction, pending] = useActionState(addClientByEmail, initial);

  return (
    <form action={formAction} className="space-y-3">
      <input
        name="email"
        type="email"
        required
        placeholder="email@cliente.com"
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-[#D42B27] focus:ring-2 focus:ring-[#D42B27]/20"
      />
      <button
        disabled={pending}
        className="w-full rounded-2xl bg-slate-900 py-3 font-semibold text-white transition-colors hover:bg-slate-700 disabled:opacity-50"
      >
        {pending ? "Collegamento..." : "Collega cliente"}
      </button>

      {state.error && (
        <p className="flex items-start gap-2 text-sm text-[#D42B27]">
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
