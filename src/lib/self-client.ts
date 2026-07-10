import { prisma } from "@/lib/prisma";

// Il personal trainer è anche "cliente di sé stesso": un ClientProfile con
// userId = il suo e trainerId = il suo TrainerProfile. Così può avere una scheda
// personale e allenarsi riusando TUTTO il macchinario cliente (schede, tracker
// sessioni, progressi, medaglie) senza duplicare codice.
// Questo auto-cliente va SEMPRE escluso dalle liste clienti del trainer.
export async function getOrCreateSelfClient(userId: string, trainerProfileId: string) {
  // upsert = race-safe: due richieste rapide alla prima visita non collidono
  return prisma.clientProfile.upsert({
    where: { userId },
    create: {
      userId,
      trainerId: trainerProfileId,
      profileCompleted: true, // è il PT stesso: niente onboarding cliente
      goals: [],
    },
    update: {},
  });
}
