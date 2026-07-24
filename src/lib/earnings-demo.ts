// ⚠️ DATI DIMOSTRATIVI — non reali.
// Servono solo a collaudare l'aspetto dell'area Guadagni con dei movimenti.
// Per AZZERARE tutto dopo il collaudo: sostituisci il corpo di getEarningsData()
// con `return EMPTY;` (già pronto in fondo al file). Un'unica modifica.

export type MovementStatus = "confirmed" | "pending" | "cancelled";

export type Movement = {
  id: string;
  kind: "direct" | "network";
  title: string;
  subtitle: string; // cliente (dirette) o "Livello N" (rete)
  date: string;
  amount: number;
  status: MovementStatus;
  // Dettaglio del calcolo — solo per le vendite DIRETTE (la rete resta anonima)
  detail?: { price: number; commission: number; costs: number; pv: number; pct: number };
};

export type LadderRank = {
  name: string;
  levelIndex: number; // 1..7
  pct: string; // etichetta (es. "10%" o "3×1%")
  state: "unlocked" | "current" | "locked";
  stage?: { current: number; total: number };
};

export type EarningsData = {
  demo: boolean;
  totalEarnings: number; // guadagno totale di sempre (tessera "Guadagni totali" in dashboard)
  activity: {
    active: boolean;
    daysToRenew: number;
    generatedCycle: number;
    threshold: number;
    withinFirst6Months: boolean;
  };
  balance: { month: number; available: number; pending: number; vsPrevMonth: number };
  // Statistiche per mese (l'ultimo = mese corrente). value = altezza barra 0..1
  // clients = clienti diversi che hanno comprato quel mese · sales = numero di acquisti
  trend: { label: string; value: number; total: number; direct: number; network: number; clients: number; sales: number }[];
  origin: {
    direct: { amount: number; products: number; clients: number };
    network: {
      total: number;
      levels: { level: number; pct: number; count: number; amount: number; unlocked: boolean }[];
    };
  };
  career: {
    rankName: string;
    stage: number | null;
    levelIndex: number;
    depthUnlocked: number;
    depthTotal: number;
    nextLabel: string;
    reqs: { rank: string | null; have: number; need: number }[];
    ladder: LadderRank[];
    networkSharePct: number; // 30
  };
  topProducts: { name: string; qty: number; amount: number }[];
  payout: { nextAmount: number; nextAvailableInDays: number };
  movements: Movement[];
};

const DEMO: EarningsData = {
  demo: true,
  totalEarnings: 27.6, // saldo totale = disponibile + in attesa (22,40 + 5,20)
  // DEMO impostato su INATTIVO per collaudare il caso "non attivo".
  // Rimetti active: true per tornare allo stato attivo (o usa il toggle in pagina).
  activity: { active: false, daysToRenew: 12, generatedCycle: 3.2, threshold: 5, withinFirst6Months: true },
  // saldo totale (available + pending) = 27,60 · guadagno del mese = 14,60
  balance: { month: 14.6, available: 22.4, pending: 5.2, vsPrevMonth: 3.1 },
  trend: [
    { label: "Mar", value: 0.35, total: 5.1, direct: 3.2, network: 1.9, clients: 4, sales: 6 },
    { label: "Apr", value: 0.5, total: 7.3, direct: 4.5, network: 2.8, clients: 6, sales: 10 },
    { label: "Mag", value: 0.42, total: 6.1, direct: 3.9, network: 2.2, clients: 5, sales: 9 },
    { label: "Giu", value: 0.68, total: 9.9, direct: 6.1, network: 3.8, clients: 7, sales: 14 },
    { label: "Lug", value: 1, total: 14.6, direct: 8.4, network: 6.2, clients: 6, sales: 17 },
  ],
  origin: {
    direct: { amount: 8.4, products: 14, clients: 6 },
    network: {
      total: 6.2,
      levels: [
        { level: 1, pct: 10, count: 10, amount: 4.8, unlocked: true },
        { level: 2, pct: 5, count: 4, amount: 1.4, unlocked: true },
        { level: 3, pct: 3, count: 1, amount: 0, unlocked: true },
        { level: 4, pct: 3, count: 0, amount: 0, unlocked: true },
        { level: 5, pct: 3, count: 0, amount: 0, unlocked: true },
        { level: 6, pct: 3, count: 0, amount: 0, unlocked: false },
        { level: 7, pct: 3, count: 0, amount: 0, unlocked: false },
      ],
    },
  },
  career: {
    rankName: "Mentor",
    stage: 2,
    levelIndex: 5,
    depthUnlocked: 5,
    depthTotal: 7,
    nextLabel: "Mentor · Stage 3",
    reqs: [
      { rank: null, have: 74, need: 80 },
      { rank: "Head Coach", have: 6, need: 6 },
      { rank: "Master Trainer", have: 2, need: 3 },
    ],
    ladder: [
      { name: "Trainer", levelIndex: 1, pct: "10%", state: "unlocked" },
      { name: "Coach", levelIndex: 2, pct: "5%", state: "unlocked" },
      { name: "Head Coach", levelIndex: 3, pct: "3%", state: "unlocked" },
      { name: "Master Trainer", levelIndex: 4, pct: "3×1%", state: "unlocked" },
      { name: "Mentor", levelIndex: 5, pct: "3×1%", state: "current", stage: { current: 2, total: 3 } },
      { name: "Ambassador", levelIndex: 6, pct: "3×1%", state: "locked" },
      { name: "Master Coach", levelIndex: 7, pct: "3×1%", state: "locked" },
    ],
    networkSharePct: 30,
  },
  topProducts: [
    { name: "Proteine Whey Isolate 1kg", qty: 5, amount: 1.25 },
    { name: "Creatina Monoidrata 500g", qty: 4, amount: 0.8 },
    { name: "Foam Roller in EVA", qty: 3, amount: 0.72 },
  ],
  payout: { nextAmount: 9.4, nextAvailableInDays: 0 },
  movements: [
    {
      id: "m1", kind: "direct", title: "Proteine Whey Isolate 1kg", subtitle: "Giulia Rossi",
      date: "24 lug", amount: 0.25, status: "confirmed",
      detail: { price: 29.9, commission: 2.49, costs: 0, pv: 2.49, pct: 10 },
    },
    {
      id: "m2", kind: "network", title: "Guadagno da rete", subtitle: "Livello 1",
      date: "23 lug", amount: 0.18, status: "confirmed",
    },
    {
      id: "m3", kind: "direct", title: "Foam Roller in EVA", subtitle: "Marco Bianchi",
      date: "22 lug", amount: 0.12, status: "pending",
      detail: { price: 24.99, commission: 1.25, costs: 0, pv: 1.25, pct: 10 },
    },
    {
      id: "m4", kind: "network", title: "Guadagno da rete", subtitle: "Livello 2",
      date: "20 lug", amount: 0.06, status: "confirmed",
    },
    {
      id: "m5", kind: "direct", title: "Barrette proteiche (box 12)", subtitle: "Anna Verdi",
      date: "18 lug", amount: 0.09, status: "cancelled",
      detail: { price: 18.5, commission: 0.93, costs: 0, pv: 0.93, pct: 10 },
    },
  ],
};

const EMPTY: EarningsData = {
  demo: false,
  totalEarnings: 0,
  activity: { active: false, daysToRenew: 30, generatedCycle: 0, threshold: 5, withinFirst6Months: true },
  balance: { month: 0, available: 0, pending: 0, vsPrevMonth: 0 },
  trend: [],
  origin: {
    direct: { amount: 0, products: 0, clients: 0 },
    network: { total: 0, levels: [] },
  },
  career: {
    rankName: "Trainer", stage: null, levelIndex: 1, depthUnlocked: 1, depthTotal: 7,
    nextLabel: "Coach", reqs: [{ rank: null, have: 0, need: 15 }],
    ladder: [
      { name: "Trainer", levelIndex: 1, pct: "10%", state: "current" },
      { name: "Coach", levelIndex: 2, pct: "5%", state: "locked" },
      { name: "Head Coach", levelIndex: 3, pct: "3%", state: "locked" },
      { name: "Master Trainer", levelIndex: 4, pct: "3×1%", state: "locked" },
      { name: "Mentor", levelIndex: 5, pct: "3×1%", state: "locked" },
      { name: "Ambassador", levelIndex: 6, pct: "3×1%", state: "locked" },
      { name: "Master Coach", levelIndex: 7, pct: "3×1%", state: "locked" },
    ],
    networkSharePct: 30,
  },
  topProducts: [],
  payout: { nextAmount: 0, nextAvailableInDays: 0 },
  movements: [],
};

// Cambia in `return EMPTY;` per azzerare l'area Guadagni dopo il collaudo.
export function getEarningsData(): EarningsData {
  return DEMO;
}

export { EMPTY };
