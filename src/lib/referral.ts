import { prisma } from "./prisma";

// Codice leggibile, niente caratteri ambigui (0/O, 1/I)
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function randomCode(length = 6): string {
  let s = "";
  for (let i = 0; i < length; i++) {
    s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return s;
}

// Genera un codice univoco non ancora usato da nessun trainer
export async function generateUniqueReferralCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = randomCode(6);
    const existing = await prisma.trainerProfile.findUnique({
      where: { referralCode: code },
    });
    if (!existing) return code;
  }
  // Fallback estremamente improbabile
  return randomCode(8);
}

// Un codice "cuid" di default è lungo (>10) e minuscolo: lo consideriamo non-friendly
export function isFriendlyCode(code: string): boolean {
  return /^[A-Z0-9]{5,8}$/.test(code);
}

// Garantisce che il trainer abbia un codice leggibile; rigenera se è un vecchio cuid
export async function ensureFriendlyReferralCode(
  trainerId: string,
  currentCode: string
): Promise<string> {
  if (isFriendlyCode(currentCode)) return currentCode;
  const code = await generateUniqueReferralCode();
  await prisma.trainerProfile.update({
    where: { id: trainerId },
    data: { referralCode: code },
  });
  return code;
}
