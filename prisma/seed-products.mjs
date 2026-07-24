// Seed del catalogo prodotti BYH (affiliate Amazon).
// Uso:  node prisma/seed-products.mjs
//
// NOTA: i link sono provvisori (ricerca Amazon per nome prodotto). Quando avrai
// l'account Associates, sostituiscili con i link deep del prodotto (ASIN) che
// portano il tag affiliato BYH. Se imposti AMAZON_ASSOCIATE_TAG in .env.local,
// il tag viene aggiunto automaticamente qui sotto.
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const TAG = process.env.AMAZON_ASSOCIATE_TAG || "";

function amazonSearchUrl(query) {
  const u = new URL("https://www.amazon.it/s");
  u.searchParams.set("k", query);
  if (TAG) u.searchParams.set("tag", TAG);
  return u.toString();
}

const PRODUCTS = [
  // Integratori
  { name: "Proteine Whey Isolate 1kg", category: "supplements", salePrice: 29.9, description: "Proteine del siero isolate ad alto valore biologico. Ideali nel post-allenamento per il recupero muscolare." },
  { name: "Creatina Monoidrata 500g", category: "supplements", salePrice: 19.9, description: "Creatina micronizzata pura. Supporta forza e potenza negli sforzi brevi e intensi." },
  { name: "Magnesio e Potassio", category: "supplements", salePrice: 12.5, description: "Reintegro di sali minerali: utile con sudorazione abbondante e nei mesi caldi." },
  { name: "Omega 3 ad alta concentrazione", category: "supplements", salePrice: 21.9, description: "EPA e DHA per il supporto cardiovascolare e articolare." },

  // Recupero
  { name: "Foam Roller in EVA", category: "recovery", salePrice: 24.99, description: "Rullo per automassaggio miofasciale: scioglie le tensioni dopo le sedute pesanti." },
  { name: "Bande elastiche di resistenza", category: "recovery", salePrice: 16.9, description: "Set di elastici per attivazione, mobilità e riscaldamento articolare." },
  { name: "Pistola massaggiante percussiva", category: "recovery", salePrice: 59.9, description: "Massaggiatore a percussione per il recupero muscolare profondo." },
  { name: "Tappetino fitness antiscivolo", category: "recovery", salePrice: 27.9, description: "Tappetino spesso per mobilità, stretching e lavoro a corpo libero." },

  // Alimentazione
  { name: "Barrette proteiche (box 12)", category: "food", salePrice: 18.5, description: "Snack proteico pratico per lo spuntino o il post-allenamento fuori casa." },
  { name: "Burro di arachidi 100%", category: "food", salePrice: 9.9, description: "Solo arachidi tostate: grassi buoni e proteine per colazioni e spuntini." },
  { name: "Fiocchi d'avena integrali 1kg", category: "food", salePrice: 7.5, description: "Carboidrati a lento rilascio, base ideale per la colazione pre-allenamento." },

  // Abbigliamento
  { name: "T-shirt tecnica traspirante", category: "apparel", salePrice: 22.0, description: "Tessuto tecnico che allontana il sudore: comoda in palestra e all'aperto." },
  { name: "Leggings sportivi a vita alta", category: "apparel", salePrice: 29.9, description: "Tessuto elastico e opaco, con vita alta che resta in posizione durante il movimento." },
  { name: "Scarpe da training", category: "apparel", salePrice: 74.9, description: "Suola stabile per il lavoro con i pesi e versatile per il condizionamento." },
];

async function main() {
  let created = 0;
  let updated = 0;

  for (const p of PRODUCTS) {
    const amazonUrl = amazonSearchUrl(p.name);
    const existing = await prisma.product.findFirst({ where: { name: p.name } });

    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: { ...p, amazonUrl, costPrice: 0, isActive: true },
      });
      updated++;
    } else {
      await prisma.product.create({
        data: { ...p, amazonUrl, costPrice: 0, isActive: true },
      });
      created++;
    }
  }

  console.log(`Catalogo BYH: ${created} prodotti creati, ${updated} aggiornati.`);
  if (!TAG) console.log("Nessun AMAZON_ASSOCIATE_TAG impostato: i link sono senza tag affiliato.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
