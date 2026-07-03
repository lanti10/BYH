import { Construction } from "lucide-react";

export function ComingSoon({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">{title}</h1>
      <p className="text-slate-500 mb-8">
        {description ?? "Questa sezione è in costruzione."}
      </p>
      <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white py-20 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand/10">
          <Construction className="h-7 w-7 text-brand" />
        </div>
        <p className="text-lg font-semibold text-slate-700">In arrivo presto</p>
        <p className="mt-1 max-w-sm text-sm text-slate-400">
          Stiamo lavorando a questa funzionalità. Sarà disponibile in un prossimo aggiornamento.
        </p>
      </div>
    </div>
  );
}
