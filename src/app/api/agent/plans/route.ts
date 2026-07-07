import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { agentAuthorized } from "@/lib/agent/auth";
import { createPlanFromAgent, type AgentPlanInput } from "@/lib/agent/create-plan";

export const maxDuration = 30;

// L'agente esterno crea una scheda in BYH. Protetta da Bearer AGENT_API_KEY.
export async function POST(req: Request) {
  if (!agentAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: AgentPlanInput;
  try {
    body = (await req.json()) as AgentPlanInput;
  } catch {
    return NextResponse.json({ error: "Body JSON non valido." }, { status: 400 });
  }

  const result = await createPlanFromAgent(body);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  // Aggiorna le viste dell'app
  revalidatePath("/trainer/workouts");

  return NextResponse.json({
    ok: true,
    planId: result.planId,
    message: "Scheda creata correttamente in BYH.",
  });
}
