import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getLocale } from "@/lib/i18n/server";

export const maxDuration = 60;

type GenerateBody = {
  planType?: "WEIGHTS" | "BODYWEIGHT" | "SWIMMING";
  trainingType?: string;
  frequency?: number;
  sex?: string;
  age?: number;
  weight?: number;
  height?: number;
  level?: string;
  goals?: string;
};

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

  const locale = await getLocale();
  const langName = { it: "italiano", en: "inglese", pt: "portoghese", es: "spagnolo" }[locale];
  const body = (await req.json()) as GenerateBody;
  const frequency = Math.min(Math.max(body.frequency ?? 3, 1), 7);

  const anthropic = new Anthropic({ apiKey: key });

  // Adatta le istruzioni al tipo di scheda scelto
  const planType = body.planType ?? "WEIGHTS";
  const planTypeInstruction = {
    WEIGHTS:
      'Scheda CON PESI (sala pesi/manubri/bilanciere). Indica un peso realistico in kg per ogni esercizio in base a sesso/peso/livello. Il campo "reps" è il numero di ripetizioni (es. "8-12").',
    BODYWEIGHT:
      'Scheda a CORPO LIBERO (nessun attrezzo/sovraccarico). Usa SEMPRE "weight": null. Scegli esercizi a corpo libero (piegamenti, trazioni, squat, plank, affondi...). Il campo "reps" è il numero di ripetizioni o i secondi di tenuta (es. "12" o "40s").',
    SWIMMING:
      'Scheda di NUOTO (in piscina). Usa SEMPRE "weight": null. Gli "esercizi" sono serie di nuoto: nel campo "reps" indica distanza e stile (es. "4 × 50m stile libero", "200m dorso"). Il campo "sets" è il numero di ripetizioni della serie e "restSeconds" il recupero tra le serie.',
  }[planType];

  const prompt = `Sei un personal trainer esperto. Crea una scheda di allenamento settimanale personalizzata.

TIPO DI SCHEDA: ${planTypeInstruction}

Parametri:
- Tipo di allenamento/obiettivo: ${body.trainingType || "ipertrofia"}
- Frequenza: ${frequency} allenamenti a settimana
- Sesso: ${body.sex || "non specificato"}
- Età: ${body.age || "non specificata"}
- Peso: ${body.weight ? body.weight + " kg" : "non specificato"}
- Altezza: ${body.height ? body.height + " cm" : "non specificata"}
- Livello: ${body.level || "intermedio"}
- Obiettivi/note: ${body.goals || "nessuna nota particolare"}

Crea esattamente ${frequency} giorni di allenamento (Giorno 1, Giorno 2, ...). Per ogni giorno indica un nome descrittivo (es. "Petto e tricipiti") e una lista di 4-7 esercizi con serie, ripetizioni, peso (rispetta le regole del tipo di scheda) e secondi di recupero adeguati al livello e all'obiettivo. Per ogni esercizio aggiungi in "notes" un breve suggerimento tecnico o di esecuzione (1 frase: cadenza, respirazione, errori da evitare, RPE...).

Scrivi i nomi dei giorni, degli esercizi e le note in ${langName}. Rispondi SOLO con un oggetto JSON valido, senza testo aggiuntivo, in questo formato esatto:
{
  "days": [
    {
      "name": "string",
      "exercises": [
        { "name": "string", "sets": 4, "reps": "8-12", "weight": 40, "restSeconds": 90, "notes": "string" }
      ]
    }
  ]
}`;

  try {
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2500,
      messages: [{ role: "user", content: prompt }],
    });

    const text = msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    // Estrai il primo blocco JSON
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) {
      return NextResponse.json({ error: "Risposta AI non valida. Riprova." }, { status: 502 });
    }
    const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1));

    // Normalizza
    const days = (parsed.days ?? []).slice(0, 7).map((d: Record<string, unknown>, i: number) => ({
      name: typeof d.name === "string" ? d.name : `Giorno ${i + 1}`,
      exercises: Array.isArray(d.exercises)
        ? d.exercises.slice(0, 12).map((e: Record<string, unknown>) => ({
            name: typeof e.name === "string" ? e.name : "Esercizio",
            sets: typeof e.sets === "number" ? e.sets : 3,
            reps: e.reps != null ? String(e.reps) : "10",
            weight: typeof e.weight === "number" ? e.weight : null,
            restSeconds: typeof e.restSeconds === "number" ? e.restSeconds : 60,
            notes: typeof e.notes === "string" ? e.notes : null,
          }))
        : [],
    }));

    if (days.length === 0) {
      return NextResponse.json({ error: "L'AI non ha generato giorni. Riprova." }, { status: 502 });
    }

    return NextResponse.json({ days });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Errore sconosciuto";
    return NextResponse.json(
      { error: `Errore nella generazione AI: ${message}` },
      { status: 500 }
    );
  }
}
