<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Design system BYH Pulse — OBBLIGATORIO

Ogni UI segue `design/DESIGN.md` (distillato da `design/BYH Pulse - Design System.dc.html`).
Regole chiave: rosso #FF3B30 (`bg-brand`) SOLO per CTA/dati live/zona5, mai come superficie estesa · un solo elemento rosso pieno per schermata · card `rounded-3xl glass` (22px) · bottoni a pillola (`rounded-full`) · controlli `rounded-2xl` (16px) · font system-ui (SF Pro), max peso 700 · numeri grandi con classe `tnum` · sfondi con profondità `bg-depth-light`/`bg-depth-dark` · glass mai su glass · scala neutri iOS (slate rimappato) · verde #30D158 successo, #FF453A errore (solo testo/icone) · testo ≥11px, hit target ≥44px.

# Verifica obbligatoria pre-push

`next.config.ts` ha `ignoreBuildErrors: true` (per non bloccare i deploy Vercel), quindi il build NON fa type-check: un import mancante compila ma crasha a runtime (è già successo: `/client/profile` in 500 per un `getT` non importato). Prima di ogni push eseguire SEMPRE: `npx tsc --noEmit` e pretendere zero errori, oltre a `npm run build`.
