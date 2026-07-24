"use client";

import { useMemo, useState } from "react";
import { Search, ImageIcon, Star, ArrowUpDown, ArrowUp, ArrowDown, ChevronRight } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { DATE_LOCALE } from "@/lib/i18n/dict";
import {
  CATEGORY_KEYS,
  PRODUCT_CATEGORIES,
  formatPrice,
  type ShopProduct,
} from "@/lib/products";
import { ProductDetailSheet } from "./product-detail-sheet";

type Segment = "recommended" | "catalog";

export function ClientShopView({
  products,
  recommended,
  trainerName,
  subtag,
  hasTrainer,
  openProductId,
}: {
  products: ShopProduct[];
  recommended: Record<string, string | null>; // productId -> nota del PT
  trainerName: string | null;
  subtag: string;
  hasTrainer: boolean;
  openProductId?: string | null; // apre subito la scheda di questo prodotto
}) {
  const { t, locale } = useT();
  const [query, setQuery] = useState("");
  // Parte dai consigliati del PT, ma solo se ce ne sono davvero
  const [segment, setSegment] = useState<Segment>(
    hasTrainer && Object.keys(recommended).length > 0 ? "recommended" : "catalog",
  );
  const [category, setCategory] = useState<string>("all");
  const [sort, setSort] = useState<0 | 1 | 2>(0); // 0=nessuno, 1=crescente, 2=decrescente
  const [selected, setSelected] = useState<ShopProduct | null>(
    () => products.find((p) => p.id === openProductId) ?? null,
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = products.filter((p) => {
      if (segment === "recommended" && !(p.id in recommended)) return false;
      if (category !== "all" && p.category !== category) return false;
      if (q) {
        const hay = `${p.name} ${p.description ?? ""} ${t(CATEGORY_KEYS[p.category] ?? "")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    if (sort === 1) list = [...list].sort((a, b) => a.price - b.price);
    if (sort === 2) list = [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [products, recommended, segment, category, query, sort, t]);

  const cycleSort = () => setSort((s) => ((s + 1) % 3) as 0 | 1 | 2);
  const SortIcon = sort === 1 ? ArrowUp : sort === 2 ? ArrowDown : ArrowUpDown;

  return (
    <div className="mx-auto max-w-2xl px-4 pb-28 pt-4 lg:pb-8">
      <div className="mb-3 flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">{t("nav.shop")}</h1>
        <span className="text-xs text-slate-400">{t("shop.subtitle")}</span>
      </div>

      {/* Ricerca */}
      <div className="sticky top-2 z-10 mb-3">
        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5">
          <Search className="h-[18px] w-[18px] text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("shop.searchPh")}
            className="flex-1 bg-transparent text-base outline-none placeholder:text-slate-400"
            inputMode="search"
          />
        </div>
      </div>

      {/* Segmenti */}
      {hasTrainer && (
        <div className="mb-3 flex rounded-2xl bg-slate-200/70 p-1">
          {(["recommended", "catalog"] as Segment[]).map((s) => (
            <button
              key={s}
              onClick={() => setSegment(s)}
              className={`flex-1 rounded-xl py-2 text-[13px] font-medium transition-colors ${
                segment === s ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
              }`}
            >
              {t(s === "recommended" ? "shop.segRecommended" : "shop.segCatalog")}
            </button>
          ))}
        </div>
      )}

      {/* Chip categorie */}
      <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
        <CategoryChip active={category === "all"} onClick={() => setCategory("all")} label={t("shop.catAll")} />
        {PRODUCT_CATEGORIES.map((c) => (
          <CategoryChip key={c} active={category === c} onClick={() => setCategory(c)} label={t(CATEGORY_KEYS[c])} />
        ))}
      </div>

      {/* Conteggio + ordinamento */}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs text-slate-400">{t("shop.count", { n: filtered.length })}</span>
        <button
          onClick={cycleSort}
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium ${
            sort === 0 ? "border-slate-200 bg-white text-slate-700" : "border-brand/30 bg-brand/5 text-brand"
          }`}
        >
          <SortIcon className="h-4 w-4" />
          {t("shop.sortPrice")}
        </button>
      </div>

      {/* Griglia */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm text-slate-400">
            {segment === "recommended" ? t("shop.emptyRecommended") : t("shop.emptySearch")}
          </p>
          {segment === "recommended" && (
            <button
              onClick={() => setSegment("catalog")}
              className="mt-3 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white"
            >
              {t("shop.browseCatalog")}
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5">
          {filtered.map((p) => {
            const isRec = p.id in recommended;
            return (
              <button
                key={p.id}
                onClick={() => setSelected(p)}
                className="flex flex-col rounded-3xl border border-slate-100 bg-white p-2 text-left"
              >
                <div className="relative mb-2 flex h-24 items-center justify-center overflow-hidden rounded-2xl bg-slate-100">
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.imageUrl} alt={p.name} className="h-full w-full object-contain" />
                  ) : (
                    <ImageIcon className="h-6 w-6 text-slate-300" />
                  )}
                  {isRec && (
                    <span className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-medium text-brand">
                      <Star className="h-2.5 w-2.5" />PT
                    </span>
                  )}
                </div>
                <p className="line-clamp-2 text-[13px] font-medium leading-tight text-slate-900">{p.name}</p>
                <p className="mb-2 mt-0.5 text-[11px] text-slate-400">{t(CATEGORY_KEYS[p.category] ?? p.category)}</p>
                <div className="mt-auto flex items-center justify-between">
                  <span className="text-[15px] font-semibold text-slate-900 tnum">{formatPrice(p.price, DATE_LOCALE[locale])}</span>
                  <span className="flex items-center text-[11px] font-medium text-brand">{t("shop.details")}<ChevronRight className="h-3 w-3" /></span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <p className="mt-4 text-center text-[10px] text-slate-400">{t("shop.priceDisclaimer")}</p>

      {selected && (
        <ProductDetailSheet
          product={selected}
          subtag={subtag}
          recommended={selected.id in recommended}
          trainerNote={recommended[selected.id] ?? null}
          trainerName={trainerName}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function CategoryChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
        active ? "bg-brand text-white" : "border border-slate-200 bg-white text-slate-600"
      }`}
    >
      {label}
    </button>
  );
}
