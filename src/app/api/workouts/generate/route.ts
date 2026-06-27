import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;

type GenerateBody = {
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

  const body = (await req.json()) as GenerateBody;
  const frequency = Math.min(Math.max(body.frequency ?? 3, 1), 7);

  const anthropic = new Anthropic({ apiKey: key });

  const prompt = `Sei un personal trainer esperto. Crea una scheda di allenamento settimanale personalizzata.

Parametri:
- Tipo di allenamento: ${body.trainingType || "ipertrofia"}
- Frequenza: ${frequency} allenamenti a settimana
- Sesso: ${body.sex || "non specificato"}
- Età: ${body.age || "non specificata"}
- Peso: ${body.weight ? body.weight + " kg" : "non specificato"}
- Altezza: ${body.height ? body.height + " cm" : "non specificata"}
- Livello: ${body.level || "intermedio"}
- Obiettivi/note: ${body.goals || "nessuna nota particolare"}

Crea esattamente ${frequency} giorni di allenamento (Giorno 1, Giorno 2, ...). Per ogni giorno indica un nome descrittivo (es. "Petto e tricipiti") e una lista di 4-7 esercizi con serie, ripetizioni, un peso indicativo in kg (stima realistica in base a sesso/peso/livello; usa null se a corpo libero) e secondi di recupero adeguati al livello e all'obiettivo.

Rispondi SOLO con un oggetto JSON valido, senza testo aggiuntivo, in questo formato esatto:
{
  "days": [
    {
      "name": "string",
      "exercises": [
        { "name": "string", "sets": 4, "reps": "8-12", "weight": 40, "restSeconds": 90 }
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
