// Promuove un utente ad ADMIN (o lo riporta al ruolo precedente).
//
// Il ruolo ADMIN non si assegna da nessuna parte nell'app — di proposito: chi entra
// dall'onboarding può essere solo TRAINER o CLIENT. Questo script è l'unico modo per
// creare il primo admin, e va eseguito a mano.
//
//   node --env-file=.env.local prisma/promote-admin.mjs mario@example.com
//   node --env-file=.env.local prisma/promote-admin.mjs "Mario Rossi"
//   node --env-file=.env.local prisma/promote-admin.mjs mario@example.com TRAINER   ← per revocare
//
// Accetta email o nome: alcuni account hanno l'email vuota (arrivano da Clerk senza
// che il webhook l'abbia salvata), e per email non si troverebbero.
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

const [who, role = "ADMIN"] = process.argv.slice(2);

if (!who) {
  console.error("Uso: node --env-file=.env.local prisma/promote-admin.mjs <email o nome> [ADMIN|TRAINER|CLIENT]");
  process.exit(1);
}
if (!["ADMIN", "TRAINER", "CLIENT"].includes(role)) {
  console.error(`Ruolo non valido: ${role}. Ammessi: ADMIN, TRAINER, CLIENT.`);
  process.exit(1);
}

const matches = await prisma.user.findMany({
  where: { OR: [{ email: who }, { name: who }] },
  select: { id: true, name: true, email: true, role: true },
});

if (matches.length === 0) {
  console.error(`Nessun utente trovato per "${who}". Deve prima registrarsi nell'app.`);
  process.exit(1);
}
// Meglio fermarsi che promuovere l'omonimo sbagliato.
if (matches.length > 1) {
  console.error(`"${who}" corrisponde a ${matches.length} utenti. Usa l'email esatta:`);
  for (const m of matches) console.error(`  ${m.role.padEnd(8)} ${m.email || "(email vuota)"} · ${m.name}`);
  process.exit(1);
}
const user = matches[0];

if (user.role === role) {
  console.log(`${user.email} è già ${role}. Niente da fare.`);
  process.exit(0);
}

await prisma.user.update({ where: { id: user.id }, data: { role } });
console.log(`${user.name || user.email}: ${user.role} → ${role}`);

await prisma.$disconnect();
