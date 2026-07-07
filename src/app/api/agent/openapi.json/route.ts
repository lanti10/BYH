import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Specifica OpenAPI 3 delle API dell'agente BYH.
// Incolla l'URL di questo endpoint nel wizard "Custom API → Import from API Spec → URL".
// È pubblica (solo descrizione); le chiamate reali richiedono il Bearer AGENT_API_KEY.
export async function GET(req: Request) {
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "byh-gy3r.vercel.app";
  const origin = `${proto}://${host}`;

  const exerciseSchema = {
    type: "object",
    required: ["name"],
    properties: {
      name: { type: "string", description: "Nome dell'esercizio." },
      sets: { type: "integer", description: "Numero di serie. Default 3.", default: 3 },
      reps: {
        type: "string",
        description: 'Ripetizioni come testo ("8-12", "10", "AMRAP") o, per il nuoto, distanza/stile ("4 × 50m").',
      },
      weight: {
        type: ["number", "null"],
        description: "Carico in kg. Solo per planType=WEIGHTS, altrimenti null.",
      },
      restSeconds: { type: "integer", description: "Recupero in secondi. Default 60.", default: 60 },
      notes: { type: ["string", "null"], description: "Nota/indicazione tecnica dell'esercizio." },
    },
  };

  const daySchema = {
    type: "object",
    required: ["exercises"],
    properties: {
      name: { type: "string", description: 'Nome del giorno ("Petto e tricipiti", "Giorno A").' },
      weekday: {
        type: ["integer", "null"],
        description: "Giorno fisso della settimana (1=Lun … 7=Dom) se la scheda lo specifica, altrimenti null.",
        minimum: 1,
        maximum: 7,
      },
      exercises: { type: "array", items: exerciseSchema },
    },
  };

  const spec = {
    openapi: "3.0.3",
    info: {
      title: "BYH Agent API",
      version: "1.0.0",
      description:
        "API per l'agente esterno: crea schede di allenamento ed elenca i clienti di un trainer in BYH (Build Your Health).",
    },
    servers: [{ url: origin }],
    security: [{ bearerAuth: [] }],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", description: "Chiave segreta AGENT_API_KEY." },
      },
    },
    paths: {
      "/api/agent/plans": {
        post: {
          operationId: "createPlan",
          summary: "Crea una scheda di allenamento in BYH",
          description:
            "Crea una scheda per il trainer indicato (per email), opzionalmente assegnata a un cliente (per email). La struttura è divisa in giorni ed esercizi.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["trainerEmail", "name", "days"],
                  properties: {
                    trainerEmail: {
                      type: "string",
                      description: "Email dell'account trainer proprietario della scheda.",
                    },
                    clientEmail: {
                      type: ["string", "null"],
                      description:
                        "Email del cliente a cui assegnare la scheda (deve essere già collegato al trainer). Ometti o null per salvarla come modello.",
                    },
                    planType: {
                      type: "string",
                      enum: ["WEIGHTS", "BODYWEIGHT", "SWIMMING"],
                      description: "Tipo di scheda. Default WEIGHTS.",
                    },
                    name: { type: "string", description: "Nome della scheda." },
                    description: { type: ["string", "null"], description: "Descrizione facoltativa." },
                    durationWeeks: {
                      type: ["integer", "null"],
                      description: "Durata in settimane, o null.",
                    },
                    startDate: {
                      type: ["string", "null"],
                      description: 'Data di inizio "yyyy-mm-dd", o null per oggi.',
                    },
                    days: { type: "array", items: daySchema },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Scheda creata",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      ok: { type: "boolean" },
                      planId: { type: "string" },
                      message: { type: "string" },
                    },
                  },
                },
              },
            },
            "400": { description: "Dati non validi" },
            "401": { description: "Non autorizzato" },
            "404": { description: "Trainer o cliente non trovato" },
          },
        },
      },
      "/api/agent/clients": {
        get: {
          operationId: "listClients",
          summary: "Elenca i clienti di un trainer",
          description:
            "Ritorna nome ed email dei clienti collegati al trainer indicato, per assegnare correttamente le schede.",
          parameters: [
            {
              name: "trainerEmail",
              in: "query",
              required: true,
              schema: { type: "string" },
              description: "Email dell'account trainer.",
            },
          ],
          responses: {
            "200": {
              description: "Elenco clienti",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      clients: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            name: { type: "string" },
                            email: { type: "string" },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            "401": { description: "Non autorizzato" },
            "404": { description: "Trainer non trovato" },
          },
        },
      },
    },
  };

  return NextResponse.json(spec);
}
