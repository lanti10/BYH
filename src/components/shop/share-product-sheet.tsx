"use client";

import { useEffect, useState } from "react";
import { X, Check, Send, ImageIcon } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import type { ShopProduct } from "@/lib/products";
import { shareProductInChat } from "@/app/(dashboard)/trainer/products/actions";

export type ShareClient = { userId: string; name: string; avatarUrl: string | null };

export function ShareProductSheet({
  product,
  clients,
  onClose,
  onShared,
}: {
  product: ShopProduct;
  clients: ShareClient[];
  onClose: () => void;
  onShared: () => void;
}) {
  const { t } = useT();
  const [selected, setSelected] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  async function submit() {
    if (!selected || sending) return;
    setSending(true);
    try {
      await shareProductInChat(product.id, selected, note);
      onShared();
    } catch {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative w-full max-w-md max-h-[90dvh] overflow-y-auto rounded-t-3xl glass-prominent p-4 pb-8">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-300" />
        <button
          onClick={onClose}
          aria-label={t("common.close")}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 className="text-base font-semibold text-slate-900">{t("shop.shareTitle", { name: product.name })}</h2>
        <p className="mb-3 mt-0.5 text-xs text-slate-500">{t("shop.shareSub")}</p>

        {clients.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">{t("shop.shareNoClients")}</p>
        ) : (
          <>
            <div className="mb-3 max-h-56 space-y-1.5 overflow-y-auto">
              {clients.map((c) => {
                const active = selected === c.userId;
                return (
                  <button
                    key={c.userId}
                    onClick={() => setSelected(c.userId)}
                    className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors ${
                      active ? "bg-brand/5" : "bg-slate-50"
                    }`}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-xs font-medium text-slate-600">
                      {c.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.avatarUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        (c.name || "?").slice(0, 2).toUpperCase()
                      )}
                    </span>
                    <span className="flex-1 truncate text-sm text-slate-800">{c.name}</span>
                    {active && <Check className="h-4 w-4 shrink-0 text-brand" />}
                  </button>
                );
              })}
            </div>

            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("shop.notePh")}
              rows={2}
              className="mb-3 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-base outline-none placeholder:text-slate-400 focus:border-brand"
            />

            <button
              onClick={submit}
              disabled={!selected || sending}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-brand py-3.5 text-[15px] font-medium text-white shadow-cta transition-colors hover:bg-brand-hover disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
              {sending ? t("shop.sharing") : t("shop.shareCta")}
            </button>
          </>
        )}

        <div className="mt-3 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-[11px] text-slate-400">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
            <ImageIcon className="h-4 w-4 text-slate-300" />
          </span>
          {t("shop.shareHint")}
        </div>
      </div>
    </div>
  );
}
