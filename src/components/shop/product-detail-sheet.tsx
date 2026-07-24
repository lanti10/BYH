"use client";

import { useEffect } from "react";
import { X, ExternalLink, ImageIcon, Star } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { DATE_LOCALE } from "@/lib/i18n/dict";
import { buildAmazonLink, CATEGORY_KEYS, formatPrice, type ShopProduct } from "@/lib/products";

export function ProductDetailSheet({
  product,
  subtag,
  trainerNote,
  trainerName,
  recommended,
  onClose,
}: {
  product: ShopProduct;
  subtag?: string | null;
  trainerNote?: string | null;
  trainerName?: string | null;
  recommended?: boolean;
  onClose: () => void;
}) {
  const { t, locale } = useT();

  // Blocca lo scroll del body mentre lo sheet è aperto
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const buyUrl = buildAmazonLink(product.amazonUrl, subtag);
  const catLabel = t(CATEGORY_KEYS[product.category] ?? product.category);

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

        {/* Immagine */}
        <div className="mb-4 flex h-40 items-center justify-center overflow-hidden rounded-2xl bg-slate-100">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.imageUrl} alt={product.name} className="h-full w-full object-contain" />
          ) : (
            <ImageIcon className="h-9 w-9 text-slate-300" />
          )}
        </div>

        {/* Categoria + badge consigliato */}
        <div className="mb-1.5 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-600">{catLabel}</span>
          {recommended && (
            <span className="flex items-center gap-1 rounded-full bg-brand/10 px-2.5 py-1 text-[11px] font-medium text-brand">
              <Star className="h-3 w-3" />
              {t("shop.recommendedByPt")}
            </span>
          )}
        </div>

        <h2 className="text-lg font-semibold text-slate-900">{product.name}</h2>
        {product.description && (
          <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{product.description}</p>
        )}

        {/* Nota del PT */}
        {trainerNote && (
          <div className="mt-4 rounded-2xl bg-indigo-50 p-3.5">
            <p className="mb-1 text-xs font-medium text-indigo-900">
              {t("shop.whyPt", { name: trainerName || t("dash.yourTrainer") })}
            </p>
            <p className="text-[13px] leading-relaxed text-indigo-700">{trainerNote}</p>
          </div>
        )}

        {/* Blocco acquisto Amazon (contenitore neutro) */}
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3.5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">{t("shop.priceOn")}</span>
            <span className="text-sm font-semibold text-slate-800">amazon</span>
          </div>
          <div className="mb-3.5 flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-slate-900 tnum">{formatPrice(product.price, DATE_LOCALE[locale])}</span>
            <span className="text-[11px] text-slate-400">{t("shop.priceUpdated")}</span>
          </div>
          <a
            href={buyUrl}
            target="_blank"
            rel="noopener noreferrer nofollow sponsored"
            className="flex items-center justify-center gap-2 rounded-full bg-brand py-3.5 text-[15px] font-medium text-white shadow-cta transition-colors hover:bg-brand-hover"
          >
            {t("shop.buyOnAmazon")}
            <ExternalLink className="h-4 w-4" />
          </a>
          <p className="mt-2 text-center text-[10px] text-slate-400">{t("shop.redirectNote")}</p>
        </div>
      </div>
    </div>
  );
}
