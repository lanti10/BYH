import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/i18n/server";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { ReassignForm } from "./reassign-form";

type TrainerNode = {
  id: string;
  userId: string;
  name: string;
  referredById: string | null;
  referralLevel: number;
  ownClients: number;
  ownSessions: number;
  children: TrainerNode[];
  branchClients: number;
  branchSessions: number;
};

export default async function NetworkPage() {
  await requireRole("ADMIN");
  const { t } = await getT();

  const trainers = await prisma.trainerProfile.findMany({
    include: {
      user: { select: { id: true, name: true } },
      clients: { select: { id: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const sessionCounts = await prisma.workoutSession.groupBy({
    by: ["clientId"],
    _count: { _all: true },
  });
  const sessionsByClient = new Map(sessionCounts.map((s) => [s.clientId, s._count._all]));

  const nodeById = new Map<string, TrainerNode>();
  for (const tr of trainers) {
    const ownSessions = tr.clients.reduce((sum, c) => sum + (sessionsByClient.get(c.id) ?? 0), 0);
    nodeById.set(tr.id, {
      id: tr.id,
      userId: tr.user.id,
      name: tr.user.name,
      referredById: tr.referredById,
      referralLevel: tr.referralLevel,
      ownClients: tr.clients.length,
      ownSessions,
      children: [],
      branchClients: 0,
      branchSessions: 0,
    });
  }

  const roots: TrainerNode[] = [];
  for (const node of nodeById.values()) {
    if (node.referredById && nodeById.has(node.referredById)) {
      nodeById.get(node.referredById)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  function computeBranch(node: TrainerNode): { clients: number; sessions: number } {
    let clients = node.ownClients;
    let sessions = node.ownSessions;
    for (const child of node.children) {
      const sub = computeBranch(child);
      clients += sub.clients;
      sessions += sub.sessions;
    }
    node.branchClients = clients;
    node.branchSessions = sessions;
    return { clients, sessions };
  }
  roots.forEach(computeBranch);

  const allOptions = trainers.map((tr) => ({ id: tr.id, name: tr.user.name }));

  function renderNode(node: TrainerNode, depth: number) {
    const stalled = node.ownClients === 0 && node.children.length === 0;
    const options = allOptions.filter((o) => o.id !== node.id);
    return (
      <div key={node.id} style={{ marginLeft: depth * 20 }} className="space-y-2">
        <div className="rounded-3xl glass p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/admin/users/${node.userId}`} className="font-semibold text-slate-900 hover:underline">
              {node.name}
            </Link>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              {t("adm.network.level", { n: node.referralLevel })}
            </span>
            {stalled && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                <AlertTriangle className="h-3 w-3" /> {t("adm.network.stalled")}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-400">
            {t("adm.network.ownClients", { n: node.ownClients })}
            {node.children.length > 0 && (
              <>
                {" · "}
                {t("adm.network.branchTotal", { n: node.branchClients })}
                {" · "}
                {t("adm.network.sessionsInBranch", { n: node.branchSessions })}
              </>
            )}
          </p>
          <div className="mt-3">
            <ReassignForm trainerId={node.id} currentParentId={node.referredById} options={options} />
          </div>
        </div>
        {node.children.map((child) => renderNode(child, depth + 1))}
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-[28px] font-bold tracking-tight text-slate-900">{t("adm.network")}</h1>
        <p className="mt-1 text-slate-500">{t("adm.networkSub")}</p>
      </div>

      <div className="space-y-3">
        {roots.length === 0 ? (
          <p className="px-1 py-8 text-center text-sm text-slate-400">{t("adm.network.noTrainers")}</p>
        ) : (
          roots.map((r) => renderNode(r, 0))
        )}
      </div>
    </div>
  );
}
