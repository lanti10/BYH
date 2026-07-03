# BYH Pulse — Design System (v1.0, luglio 2026)

Riferimento OBBLIGATORIO per ogni UI dell'app. Fonte: `design/BYH Pulse - Design System.dc.html`.
Stile: Apple liquid glass. Palette rosso / nero / bianco. Tema light (default) e dark (sessione allenamento).

## 01 · Colori

**Primari**
- Rosso BYH `#FF3B30` — SOLO per: azioni primarie (CTA), dati "live", zona 5. MAI come sfondo di card o sezioni.
- Nero `#0B0B0D`
- Bianco `#FFFFFF`

**Scala neutri (iOS)**: `#F2F2F7` `#E5E5EA` `#C7C7CC` `#8E8E93` `#48484A` `#2C2C2E` `#1C1C1E` `#0B0B0D`

**Zone cardio** (sempre in quest'ordine): Z1–Z2 recupero `#30D158` · Z3 aerobica `#FFD60A` · Z4 soglia `#FF9F0A` · Z5 massimale `#FF3B30`

**Grafici**: serie principale `#FF3B30`, secondaria `#5AC8FA`, terziaria `#BF5AF2`, confronto/media `#8E8E93`. Max 3 colori per grafico.

**Stati**: successo `#30D158` · avviso `#FF9F0A` · errore/distruttivo `#FF453A` (solo testo e icone, distinto dal rosso brand).

## 02 · Tipografia

Un solo font: **SF Pro** (`-apple-system, system-ui`). NIENTE Google Fonts.
- Large Title 34/700 ls-1px · Title1 28/700 · Title2 22/600 · Headline 17/600 · Body 17/400 · Footnote 13/400 · Caption 11/500 MAIUSCOLO ls1.2px
- **Dato grande: 48/700 tabellare** (`font-variant-numeric: tabular-nums`), unità in 500 attenuato accanto.
- Tutti i valori numerici in cifre tabellari. Mai testo sotto 11px.

## 03 · Liquid glass · raggi · spaziatura

**Glass dark** (su sfondo scuro con glow): sottile blur12 bianco5%, regolare blur18 bianco7% bordo bianco14%, prominente blur24+saturate bianco12% bordo bianco20%.
**Glass light**: sottile blur12 bianco45% bordo bianco80%, regolare blur18 bianco60% bordo bianco90% + shadow `0 8px 24px rgba(0,0,0,.06)`, prominente blur24+sat bianco72% bordo bianco100%.
- Glass sempre sopra sfondo con profondità (radial glow rosso o immagine). MAI glass su glass (max 1 livello).
- Sfondo depth dark: `#0A0A0C` + `radial-gradient(90% 50% at 80% -5%, rgba(255,59,48,.3), transparent 60%)`
- Sfondo depth light: `#F2F2F7` + `radial-gradient(90% 50% at 20% -5%, rgba(255,59,48,.13), transparent 60%)`

**Raggi**: 10px chip · 16px controlli · 22px card · pieno (pillola) per bottoni/tab bar.
**Spaziatura** (base 4px): margini schermo 20px · gap card 12px · padding card 16–20px · hit target ≥ 44px.

## 04 · Componenti

- **Bottone primario**: pillola h50 rosso `#FF3B30`, testo bianco 600 16, shadow `0 6px 18px rgba(255,59,48,.4)` (.3 in light). Es. "Inizia allenamento".
- **Secondario**: pillola h44 glass regolare. **Terziario**: solo testo rosso 600 14.
- **Segmented control**: contenitore r16 glass, item attivo r13 (dark: bianco16%; light: bianco pieno + shadow), inattivi 500 attenuati.
- **Chip**: pillola pad 8×14, attiva rossa piena testo bianco 600 12, inattive glass.
- **Stat card**: glass regolare r22 pad18. Caption maiuscola in alto + badge zona (pillola r12 rosso 12-18% testo rosso). Numero 40/700 tabellare + unità 13/500. Mini bar chart con colori zona.
- **List row**: card glass r22, righe pad 14×16 divise da bordo 6-8%. Badge numero 36×36 r12 (attivo: rosso 12-16% testo rosso; altrimenti neutro). Titolo 600 14, sottotitolo 400 12 attenuato. A destra: check verde `#30D158` (fatto) o chevron `›`.
- **Tab bar**: pillola r28 glass prominente, icone 22px + label 10px, voce attiva ROSSA, inattive attenuate. Voci: Oggi · Schede · Progressi · Profilo.

## 05 · Regole d'uso

✓ SÌ: un solo elemento rosso pieno per schermata (il CTA) · glass sopra sfondi con profondità · zone cardio solo con scala verde→rosso nello stesso ordine · numeri grandi 700 tabellari con unità 500 attenuata.
✕ NO: rosso come sfondo esteso · glass su glass · più di 3 colori in un grafico · testo <11px · hit target <44px.

## Mappatura nel codice

- Token in `src/app/globals.css` (@theme Tailwind v4): `brand` = #FF3B30, neutri slate rimappati alla scala iOS, raggi rimappati (xl=10 chip, 2xl=16 controlli, 3xl=22 card).
- Utility: `.glass` (light regolare), `.glass-prominent`, `.glass-dark`, `.glass-dark-prominent`, `.bg-depth-dark`, `.bg-depth-light`, `.tnum` (tabular-nums).
- Font di sistema in `layout.tsx` (niente Geist).
- Il vecchio rosso #D42B27 è DEPRECATO → usare sempre #FF3B30 (classe `bg-brand` ecc.).
