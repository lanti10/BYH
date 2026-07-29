// Concede (o revoca) l'accesso al pannello admin.
//
// L'admin è un PERMESSO che si somma al ruolo, non un ruolo alternativo: chi ce
// l'ha continua a usare BYH da trainer o da cliente e in più entra nel pannello.
// Non è concedibile da dentro l'app, di proposito — dall'onboarding si esce solo
// TRAINER o CLIENT — quindi il primo admin va creato da qui.
//
//   node --env-file=.env.local prisma/promote-admin.mjs "Mario Rossi"
//   node --env-file=.env.local prisma/promote-admin.mjs mario@example.com
//   node --env-file=.env.local prisma/promote-admin.mjs mario@example.com off   ← revoca
//
// Accetta email o nome: alcuni account hanno l'email vuota (arrivano da Clerk senza
// che il webhook l'abbia salvata) e per email non si troverebbero.
// Nota: l'utente deve essersi già registrato almeno una volta nell'app.

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Stessa connessione dell'app (src/lib/prisma.ts): Prisma 7 vuole l'adapter esplicito.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const [who, mode = "on"] = process.argv.slice(2);

if (!who) {
  console.error('Uso: node --env-file=.env.local prisma/promote-admin.mjs "<email o nome>" [on|off]');
  process.exit(1);
}
if (!["on", "off"].includes(mode)) {
  console.error(`Modo non valido: ${mode}. Ammessi: on, off.`);
  process.exit(1);
}
const isAdmin = mode === "on";

const matches = await prisma.user.findMany({
  where: { OR: [{ email: who }, { name: who }] },
  select: { id: true, name: true, email: true, role: true, isAdmin: true },
});

if (matches.length === 0) {
  console.error(`Nessun utente trovato per "${who}". Deve prima registrarsi nell'app.`);
  process.exit(1);
}
// Meglio fermarsi che dare i poteri all'omonimo sbagliato.
if (matches.length > 1) {
  console.error(`"${who}" corrisponde a ${matches.length} utenti. Usa l'email esatta:`);
  for (const m of matches) console.error(`  ${m.role.padEnd(8)} ${m.email || "(email vuota)"} · ${m.name}`);
  process.exit(1);
}
const user = matches[0];

if (user.isAdmin === isAdmin) {
  console.log(`${user.name || user.email}: accesso admin già ${isAdmin ? "attivo" : "revocato"}. Niente da fare.`);
  process.exit(0);
}

// Un vecchio account con role ADMIN torna al ruolo che usa davvero: il pannello
// ora è un permesso, e restare ADMIN significherebbe non vedere l'app da trainer.
const data = { isAdmin };
if (isAdmin && user.role === "ADMIN") data.role = "TRAINER";

await prisma.user.update({ where: { id: user.id }, data });

const role = data.role ?? user.role;
console.log(
  `${user.name || user.email}: accesso admin ${isAdmin ? "ATTIVO" : "revocato"} · usa l'app come ${role}`
);

await prisma.$disconnect();
