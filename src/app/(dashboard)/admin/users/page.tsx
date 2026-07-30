import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/i18n/server";
import { ChevronRight, ShieldCheck } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { SearchBox } from "./search-box";

const ROLE_FILTERS = ["all", "TRAINER", "CLIENT", "ADMIN"] as const;
const STATUS_FILTERS = ["all", "active", "suspended"] as const;

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string; status?: string }>;
}) {
  const admin = await requireRole("ADMIN");
  const { t, locale } = await getT();
  const { q = "", role = "all", status = "all" } = await searchParams;

  const where: Prisma.UserWhereInput = {
    ...(q.trim()
      ? {
          OR: [
            { name: { contains: q.trim(), mode: "insensitive" } },
            { email: { contains: q.trim(), mode: "insensitive" } },
          ],
        }
      : {}),
    ...(ROLE_FILTERS.includes(role as (typeof ROLE_FILTERS)[number]) && role !== "all"
      ? { role: role as "TRAINER" | "CLIENT" | "ADMIN" }
      : {}),
    ...(status === "active" ? { suspended: false } : status === "suspended" ? { suspended: true } : {}),
  };

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    select: { id: true, name: true, email: true, role: true, isAdmin: true, suspended: true, createdAt: true },
  });

  function chip(param: string, value: string, label: string, active: boolean) {
    const params = new URLSearchParams({ q, role, status });
    params.set(param, value);
    return (
      <Link
        key={`${param}-${value}`}
        href={`?${params.toString()}`}
        className={`inline-flex min-h-9 items-center rounded-full px-3.5 text-xs font-medium transition-colors ${
          active ? "bg-ink text-white" : "glass text-slate-600 hover:bg-black/5"
        }`}
      >
        {label}
      </Link>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-[28px] font-bold tracking-tight text-slate-900">{t("adm.people")}</h1>
        <p className="mt-1 text-slate-500">{t("adm.peopleSub")}</p>
      </div>

      <SearchBox initialQ={q} />

      <div className="flex flex-wrap gap-2">
        {chip("role", "all", t("adm.people.statusAll"), role === "all")}
        {chip("role", "TRAINER", t("role.trainer"), role === "TRAINER")}
        {chip("role", "CLIENT", t("role.client"), role === "CLIENT")}
      </div>
      <div className="flex flex-wrap gap-2">
        {chip("status", "all", t("adm.people.statusAll"), status === "all")}
        {chip("status", "active", t("adm.people.statusActive"), status === "active")}
        {chip("status", "suspended", t("adm.people.statusSuspended"), status === "suspended")}
      </div>

      <div className="space-y-2">
        {users.length === 0 && (
          <p className="px-1 py-8 text-center text-sm text-slate-400">{t("adm.people.noResults")}</p>
        )}
        {users.map((u) => (
          <Link
            key={u.id}
            href={`/admin/users/${u.id}`}
            className="flex min-w-0 items-center gap-3 rounded-3xl glass p-4 transition-shadow hover:shadow-md"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate font-semibold text-slate-900">{u.name}</span>
                {u.isAdmin && <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-slate-400" />}
                {u.suspended && (
                  <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-600">
                    {t("adm.people.suspended")}
                  </span>
                )}
              </div>
              <p className="truncate text-sm text-slate-400">{u.email}</p>
              <p className="mt-0.5 text-xs text-slate-400">
                {t(`role.${u.role.toLowerCase()}`)} · {t("adm.people.joined", { date: u.createdAt.toLocaleDateString(locale) })}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
          </Link>
        ))}
      </div>
    </div>
  );
}
