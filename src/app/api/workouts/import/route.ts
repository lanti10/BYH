import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getLocale } from "@/lib/i18n/server";

export const maxDuration = 60;

const MAX_BYTES = 12 * 1024 * 1024; // 12 MB
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || key.includes("XXXX") || !key.startsWith("sk-ant-")) {
    return NextResponse.json(
      {
        error:
          "AI non configurata. Aggiungi una chiave ANTHROPIC_API_KEY valida nelle variabili d'ambiente (Vercel e .env.local).",
      },
      { status: 400 }
    );
  }

  let file: File | null = null;
  try {
    const form = await req.formData();
    file = form.get("file") as File | null;
  } catch {
    return NextResponse.json({ error: "File non valido." }, { status: 400 });
  }
  if (!file || file.size === 0) {
    return NextResponse.json({ error: "Nessun file caricato." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File troppo grande (max 12 MB)." }, { status: 400 });
  }

  const locale = await getLocale();
  const langName = { it: "italiano", en: "inglese", pt: "portoghese", es: "spagnolo" }[locale];

  const type = (file.type || "").toLowerCase();
  const name = (file.name || "").toLowerCase();
  const isImage = IMAGE_TYPES.includes(type) || /\.(jpe?g|png|gif|webp)$/.test(name);
  const isPdf = type === "application/pdf" || name.endsWith(".pdf");

  const instructions = `Sei un assistente che digitalizza schede di allenamento. Ti viene fornita una scheda già pronta (immagine, PDF o testo). Estrai TUTTO il contenuto e restituiscilo in JSON strutturato.

Regole:
- "planType": deduci il tipo di scheda tra "WEIGHTS" (pesi/palestra/manubri/bilanciere), "BODYWEIGHT" (corpo libero/calisthenics) o "SWIMMING" (nuoto/piscina). Se incerto usa "WEIGHTS".
- "name": un nome breve della scheda (se non c'è, inventane uno coerente).
- "durationWeeks": numero di settimane se indicato, altrimenti null.
- "days": un elemento per ogni giorno/seduta di allenamento, in ordine.
  - "name": nome del giorno (es. "Petto e tricipiti", "Giorno A", "Gambe"). Se assente usa "Giorno N".
  - "weekday": se la scheda associa il giorno a un giorno preciso della settimana (Lunedì, Mar, Mon, ecc.) metti il numero 1=Lunedì ... 7=Domenica; altrimenti null.
  - "exercises": lista esercizi con:
    - "name": nome esercizio.
    - "sets": numero di serie (intero; se assente 3).
    - "reps": ripetizioni come stringa (es. "8-12", "10", "AMRAP"; per il nuoto la distanza/stile es. "4 × 50m stile").
    - "weight": carico in kg SOLO per WEIGHTS (numero) altrimenti null.
    - "restSeconds": recupero in secondi (intero; se assente 60).
    - "notes": eventuali note/indicazioni tecniche dalla scheda, altrimenti null.
- Se la scheda descrive fasi/settimane diverse con esercizi che cambiano nel tempo, usa la PRIMA fase/settimana come struttura dei giorni e riassumi le variazioni successive nel campo "notes" dell'esercizio interessato.
- Traduci nomi ed etichette in ${langName} solo se necessario; mantieni i nomi tecnici degli esercizi.

Rispondi SOLO con un oggetto JSON valido, senza testo aggiuntivo, in questo formato:
{
  "planType": "WEIGHTS",
  "name": "string",
  "durationWeeks": null,
  "days": [
    { "name": "string", "weekday": null, "exercises": [ { "name": "string", "sets": 4, "reps": "8-12", "weight": 40, "restSeconds": 90, "notes": null } ] }
  ]
}`;

  // Costruisci il contenuto del messaggio in base al tipo di file
  const content: Anthropic.ContentBlockParam[] = [];
  try {
    if (isImage) {
      const b64 = Buffer.from(await file.arrayBuffer()).toString("base64");
      const mediaType = (IMAGE_TYPES.includes(type) ? type : "image/jpeg") as
        | "image/jpeg"
        | "image/png"
        | "image/gif"
        | "image/webp";
      content.push({ type: "image", source: { type: "base64", media_type: mediaType, data: b64 } });
      content.push({ type: "text", text: instructions });
    } else if (isPdf) {
      const b64 = Buffer.from(await file.arrayBuffer()).toString("base64");
      content.push({
        type: "document",
        source: { type: "base64", media_type: "application/pdf", data: b64 },
      });
      content.push({ type: "text", text: instructions });
    } else {
      // CSV / TXT / altri formati testuali
      const text = await file.text();
      if (!text.trim()) {
        return NextResponse.json(
          { error: "Formato non supportato. Usa PDF, immagine (JPG/PNG), CSV o testo." },
          { status: 400 }
        );
      }
      content.push({
        type: "text",
        text: `${instructions}\n\nContenuto della scheda:\n"""\n${text.slice(0, 20000)}\n"""`,
      });
    }
  } catch {
    return NextResponse.json({ error: "Impossibile leggere il file." }, { status: 400 });
  }

  const anthropic = new Anthropic({ apiKey: key });

  try {
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      messages: [{ role: "user", content }],
    });

    const raw = msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    const jsonStart = raw.indexOf("{");
    const jsonEnd = raw.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) {
      return NextResponse.json(
        { error: "Non sono riuscito a leggere la scheda dal file. Prova con un file più chiaro." },
        { status: 502 }
      );
    }
    const parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1));

    const planType = ["WEIGHTS", "BODYWEIGHT", "SWIMMING"].includes(parsed.planType)
      ? parsed.planType
      : "WEIGHTS";
    const usesWeight = planType === "WEIGHTS";

    const days = (parsed.days ?? []).slice(0, 14).map((d: Record<string, unknown>, i: number) => {
      const wd = typeof d.weekday === "number" && d.weekday >= 1 && d.weekday <= 7 ? d.weekday : null;
      return {
        name: typeof d.name === "string" && d.name.trim() ? d.name : `Giorno ${i + 1}`,
        weekday: wd,
        exercises: Array.isArray(d.exercises)
          ? d.exercises.slice(0, 20).map((e: Record<string, unknown>) => ({
              name: typeof e.name === "string" ? e.name : "Esercizio",
              sets: typeof e.sets === "number" ? e.sets : 3,
              reps: e.reps != null ? String(e.reps) : "10",
              weight: usesWeight && typeof e.weight === "number" ? e.weight : null,
              restSeconds: typeof e.restSeconds === "number" ? e.restSeconds : 60,
              notes: typeof e.notes === "string" ? e.notes : null,
            }))
          : [],
      };
    });

    if (days.length === 0) {
      return NextResponse.json(
        { error: "Nessun allenamento trovato nel file. Controlla che sia una scheda leggibile." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      planType,
      name: typeof parsed.name === "string" ? parsed.name : "",
      durationWeeks: typeof parsed.durationWeeks === "number" ? parsed.durationWeeks : null,
      days,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Errore sconosciuto";
    return NextResponse.json({ error: `Errore nell'importazione: ${message}` }, { status: 500 });
  }
}
