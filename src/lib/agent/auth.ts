// Autenticazione delle API dell'agente esterno.
// Non usa il login Clerk: l'agente si identifica con una chiave segreta condivisa
// passata come header `Authorization: Bearer <AGENT_API_KEY>`.

export function agentAuthorized(req: Request): boolean {
  const expected = process.env.AGENT_API_KEY;
  if (!expected || expected.length < 16) return false; // chiave non configurata → nega
  const header = req.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (token.length !== expected.length) return false;
  // confronto a tempo costante
  let diff = 0;
  for (let i = 0; i < token.length; i++) diff |= token.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}
