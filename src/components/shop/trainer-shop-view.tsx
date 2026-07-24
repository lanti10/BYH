"use client";

import { useMemo, useState } from "react";
import { Search, ImageIcon, Star, Check, Send, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { DATE_LOCALE } from "@/lib/i18n/dict";
import { CATEGORY_KEYS, PRODUCT_CATEGORIES, formatPrice, type ShopProduct } from "@/lib/products";
import { ProductDetailSheet } from "./product-detail-sheet";
import { ShareProductSheet, type ShareClient } from "./share-product-sheet";
import { togglePick } from "@/app/(dashboard)/trainer/products/actions";

type Segment = "catalog" | "picks";

export function TrainerShopView({
  products,
  initialPicked,
  clients,
  trainerSubtag,
}: {
  products: ShopProduct[];
  initialPicked: string[];
  clients: ShareClient[];
  trainerSubtag: string;
}) {
  const { t, locale } = useT();
  const [query, setQuery] = useState("");
  const [segment, setSegment] = useState<Segment>("catalog");
  const [category, setCategory] = useState<string>("all");
  const [sort, setSort] = useState<0 | 1 | 2>(0);
  const [picked, setPicked] = useState<Set<string>>(new Set(initialPicked));
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [detail, setDetail] = useState<ShopProduct | null>(null);
  const [share, setShare] = useState<ShopProduct | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  async function onToggle(id: string) {
    if (pending.has(id)) return;
    setPending((s) => new Set(s).add(id));
    // ottimistico
    const next = new Set(picked);
    next.has(id) ? next.delete(id) : next.add(id);
    setPicked(next);
    try {
      const res = await togglePick(id);
      setPicked((cur) => {
        const n = new Set(cur);
        res.picked ? n.add(id) : n.delete(id);
        return n;
      });
    } catch {
      setPicked((cur) => {
        const n = new Set(cur);
        n.has(id) ? n.delete(id) : n.add(id);
        return n;
      });
    } finally {
      setPending((s) => {
        const n = new Set(s);
        n.delete(id);
        return n;
      });
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = products.filter((p) => {
      if (segment === "picks" && !picked.has(p.id)) return false;
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
  }, [products, picked, segment, category, query, sort, t]);

  const cycleSort = () => setSort((s) => ((s + 1) % 3) as 0 | 1 | 2);
  const SortIcon = sort === 1 ? ArrowUp : sort === 2 ? ArrowDown : ArrowUpDown;

  return (
    <div className="mx-auto max-w-2xl px-4 pb-28 pt-4 lg:pb-8">
      <div className="mb-3 flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">{t("nav.products")}</h1>
        <span className="text-xs text-slate-400">{t("shop.trainerSubtitle")}</span>
      </div>

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

      <div className="mb-3 flex rounded-2xl bg-slate-200/70 p-1">
        {(["catalog", "picks"] as Segment[]).map((s) => (
          <button
            key={s}
            onClick={() => setSegment(s)}
            className={`flex-1 rounded-xl py-2 text-[13px] font-medium transition-colors ${
              segment === s ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
            }`}
          >
            {t(s === "catalog" ? "shop.segCatalog" : "shop.segMyPicks")}
          </button>
        ))}
      </div>

      <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
        <Chip active={category === "all"} onClick={() => setCategory("all")} label={t("shop.catAll")} />
        {PRODUCT_CATEGORIES.map((c) => (
          <Chip key={c} active={category === c} onClick={() => setCategory(c)} label={t(CATEGORY_KEYS[c])} />
        ))}
      </div>

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

      {filtered.length === 0 ? (
        <p className="py-16 text-center text-sm text-slate-400">
          {segment === "picks" ? t("shop.emptyPicks") : t("shop.emptySearch")}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2.5">
          {filtered.map((p) => {
            const isPicked = picked.has(p.id);
            return (
              <div key={p.id} className="flex flex-col rounded-3xl border border-slate-100 bg-white p-2">
                <button onClick={() => setDetail(p)} className="text-left">
                  <div className="mb-2 flex h-24 items-center justify-center overflow-hidden rounded-2xl bg-slate-100">
                    {p.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.imageUrl} alt={p.name} className="h-full w-full object-contain" />
                    ) : (
                      <ImageIcon className="h-6 w-6 text-slate-300" />
                    )}
                  </div>
                  <p className="line-clamp-2 text-[13px] font-medium leading-tight text-slate-900">{p.name}</p>
                  <p className="mb-2 mt-0.5 text-[11px] text-slate-400">
                    {t(CATEGORY_KEYS[p.category] ?? p.category)} · <span className="tnum">{formatPrice(p.price, DATE_LOCALE[locale])}</span>
                  </p>
                </button>
                <div className="mt-auto flex gap-1.5">
                  <button
                    onClick={() => onToggle(p.id)}
                    className={`flex flex-1 items-center justify-center gap-1 rounded-full py-1.5 text-[11px] font-medium transition-colors ${
                      isPicked ? "bg-brand text-white" : "bg-brand/10 text-brand"
                    }`}
                  >
                    {isPicked ? <Check className="h-3 w-3" /> : <Star className="h-3 w-3" />}
                    {t(isPicked ? "shop.picked" : "shop.pick")}
                  </button>
                  <button
                    onClick={() => setShare(p)}
                    aria-label={t("shop.shareCta")}
                    className="flex w-9 items-center justify-center rounded-full bg-slate-100 py-1.5 text-slate-600"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="mt-4 text-center text-[10px] text-slate-400">{t("shop.priceDisclaimer")}</p>

      {detail && (
        <ProductDetailSheet
          product={detail}
          subtag={trainerSubtag}
          recommended={picked.has(detail.id)}
          onClose={() => setDetail(null)}
        />
      )}
      {share && (
        <ShareProductSheet
          product={share}
          clients={clients}
          onClose={() => setShare(null)}
          onShared={(sent) => {
            setShare(null);
            setToast(sent > 1 ? t("shop.sharedN", { n: sent }) : t("shop.shared"));
            setTimeout(() => setToast(null), 2500);
          }}
        />
      )}
      {toast && (
        <div className="fixed bottom-24 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-slate-900 px-4 py-2 text-sm text-white shadow-lg lg:bottom-8">
          {toast}
        </div>
      )}
    </div>
  );
}

function Chip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
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
