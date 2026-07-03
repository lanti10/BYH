"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { assignTemplateToClient } from "@/app/(dashboard)/trainer/workouts/actions";
import { UserPlus, Loader2, Check, AlertCircle } from "lucide-react";
import Link from "next/link";

type ClientOption = { id: string; name: string };

export function AssignTemplate({ planId, clients }: { planId: string; clients: ClientOption[] }) {
  const router = useRouter();
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function assign() {
    if (!clientId) {
      setError("Seleziona un cliente.");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await assignTemplateToClient(planId, clientId);
    setLoading(false);
    if (res.ok) {
      setDone(true);
      router.refresh();
    } else {
      setError(res.error ?? "Errore durante l'assegnazione.");
    }
  }

  return (
    <div className="rounded-2xl glass p-5">
      <div className="flex items-center gap-2 mb-1">
        <UserPlus className="h-4 w-4 text-brand" />
        <h2 className="font-semibold text-slate-800">Assegna a un cliente</h2>
      </div>
      <p className="text-sm text-slate-500 mb-4">
        Crea una copia di questa scheda e assegnala come scheda attiva di un cliente. Il modello resta disponibile.
      </p>

      {clients.length === 0 ? (
        <p className="text-sm text-slate-400">
          Non hai ancora clienti.{" "}
          <Link href="/trainer/clients/new" className="font-semibold text-brand underline">
            Aggiungine uno
          </Link>{" "}
          per poter assegnare questa scheda.
        </p>
      ) : done ? (
        <p className="flex items-center gap-2 text-sm font-medium text-emerald-600">
          <Check className="h-4 w-4" /> Scheda assegnata al cliente.
        </p>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              onClick={assign}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-6 py-3 font-semibold text-white shadow-cta transition-colors hover:bg-brand-hover disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              Assegna
            </button>
          </div>
          {error && (
            <p className="mt-3 flex items-center gap-1.5 text-sm text-brand">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </p>
          )}
        </>
      )}
    </div>
  );
}
