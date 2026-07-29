// Card da condividere sui social: storia 9:16, disegnata su canvas NEL DISPOSITIVO.
//
// Perché canvas e non un'immagine generata dal server: la variante "scatto" usa una
// foto appena scattata dall'utente. Su canvas la foto non lascia mai il telefono,
// la card esce all'istante e funziona anche offline.
//
// Tutte le coordinate sono nello spazio logico 200×355.6 (lo stesso dei mockup
// approvati) e vengono scalate a 1080×1920 da S. Nessuna misura relativa: due
// tentativi con margini proporzionali si erano già sovrapposti.

import { GRAD, HEX_PATH, HEX_INNER_PATH, glyphFor, type Prim } from "@/lib/medal-art";

export const CARD_W = 1080;
export const CARD_H = 1920;
const S = 5.4; // 200 unità logiche = 1080 px

export type ShareVariant = "photo" | "rings" | "record" | "month" | "medal" | "coach";

export type ShareCardData = {
  variant: ShareVariant;
  /** Riga d'invito + dominio in fondo: cambia solo per il PT (link della sua rete). */
  url: string;
  /** Etichetta piccola sopra il dato principale (nome della scheda, mese, ruolo). */
  eyebrow?: string;
  // Sessione
  streakDays?: number;
  durationMin?: number;
  exerciseCount?: number;
  calories?: number;
  /** Foto appena scattata, già decodificata. Solo variante "photo". */
  photo?: CanvasImageSource;
  // Record
  recordWeightKg?: number;
  recordExercise?: string;
  recordDeltaKg?: number;
  recordPrevious?: string;
  // Mese
  monthDays?: boolean[];
  monthSessions?: number;
  monthHours?: number;
  monthCalories?: number;
  // Medaglia
  medalIcon?: string;
  medalColor?: string;
  medalTitle?: string;
  medalSubtitle?: string;
  // Coach
  coachName?: string;
  coachRole?: string;
  coachClients?: number;
  coachSessions?: number;
  coachCta?: string;
  /** Traduzioni: il chiamante passa già le stringhe nella lingua dell'utente. */
  labels: ShareLabels;
};

export type ShareLabels = {
  joinUs: string; // "allenati anche tu"
  daysInARow: string; // "GIORNI DI FILA"
  min: string;
  exercises: string;
  kcal: string;
  newRecord: string; // "NUOVO RECORD"
  previous: string; // "precedente"
  medalUnlocked: string; // "MEDAGLIA SBLOCCATA"
  workouts: string; // "ALLENAMENTI"
  hours: string;
  athletes: string; // "atleti seguiti"
};

const RED = "#FF3B30";
const INK = "#0A0A0B";
const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';

// ── primitive di disegno, in unità logiche ──

type Ctx = CanvasRenderingContext2D;

const x = (v: number) => v * S;

function text(
  ctx: Ctx,
  s: string,
  lx: number,
  ly: number,
  size: number,
  opts: { weight?: number; color?: string; alpha?: number; spacing?: number; align?: CanvasTextAlign } = {}
) {
  const { weight = 400, color = "#FFFFFF", alpha = 1, spacing = 0, align = "left" } = opts;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = "alphabetic";
  ctx.font = `${weight} ${x(size)}px ${FONT}`;
  // letterSpacing non è ovunque: se manca, il testo esce solo un filo più stretto.
  try {
    (ctx as Ctx & { letterSpacing: string }).letterSpacing = `${x(spacing)}px`;
  } catch {}
  ctx.fillText(s, x(lx), x(ly));
  try {
    (ctx as Ctx & { letterSpacing: string }).letterSpacing = "0px";
  } catch {}
  ctx.restore();
}

/** Larghezza di un testo, in unità logiche: serve per appoggiarci l'unità di misura accanto. */
function textW(ctx: Ctx, s: string, size: number, weight = 400, spacing = 0) {
  ctx.save();
  ctx.font = `${weight} ${x(size)}px ${FONT}`;
  try {
    (ctx as Ctx & { letterSpacing: string }).letterSpacing = `${x(spacing)}px`;
  } catch {}
  const w = ctx.measureText(s).width / S;
  ctx.restore();
  return w;
}

function rect(ctx: Ctx, rx: number, ry: number, rw: number, rh: number, fill: string, radius = 0) {
  ctx.save();
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.roundRect(x(rx), x(ry), x(rw), x(rh), x(radius));
  ctx.fill();
  ctx.restore();
}

function line(ctx: Ctx, x1: number, y1: number, x2: number, y2: number, color: string, w = 0.5) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = x(w);
  ctx.beginPath();
  ctx.moveTo(x(x1), x(y1));
  ctx.lineTo(x(x2), x(y2));
  ctx.stroke();
  ctx.restore();
}

function glow(ctx: Ctx, cx: number, cy: number, r: number, color: string, alpha: number) {
  const g = ctx.createRadialGradient(x(cx), x(cy), 0, x(cx), x(cy), x(r));
  g.addColorStop(0, hexA(color, alpha));
  g.addColorStop(1, hexA(color, 0));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CARD_W, CARD_H);
}

function hexA(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

const white = (a: number) => `rgba(255,255,255,${a})`;

// ── blocchi comuni a tutte le card ──

/** Marchio in alto a sinistra: è la prima cosa che si legge e sopravvive ai ritagli. */
function brand(ctx: Ctx, dotColor = RED, inkOnRed = false) {
  ctx.save();
  ctx.fillStyle = inkOnRed ? "#FFFFFF" : dotColor;
  ctx.beginPath();
  ctx.arc(x(20), x(26), x(3.5), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  text(ctx, "BYH", 29, 30, 14, { weight: 700, spacing: 1.5 });
}

/** Riga d'invito + dominio: la parte che lavora per la piattaforma. */
function footer(ctx: Ctx, data: ShareCardData, ly: number, withRule = true) {
  if (withRule) line(ctx, 20, ly - 18, 180, ly - 18, white(0.14));
  // Solo l'host: il link del PT porta un codice referral lungo, che stampato per
  // intero sfora il bordo. Il link completo viaggia nel testo della condivisione.
  const domain = data.url.replace(/^https?:\/\//, "").split("/")[0];
  text(ctx, domain, 20, ly, 11, { weight: 700, color: RED });
  const dw = textW(ctx, domain, 11, 700);
  text(ctx, data.labels.joinUs, 20 + dw + 8, ly, 9, { alpha: 0.55 });
}

// ── varianti ──

function drawPhoto(ctx: Ctx, d: ShareCardData) {
  if (d.photo) coverImage(ctx, d.photo);
  else rect(ctx, 0, 0, 200, 356, "#33333A");

  // Velo alto e basso: il marchio e i dati devono restare leggibili su qualsiasi foto.
  const g = ctx.createLinearGradient(0, 0, 0, CARD_H);
  g.addColorStop(0, "rgba(10,10,11,0.70)");
  g.addColorStop(0.38, "rgba(10,10,11,0.05)");
  g.addColorStop(0.7, "rgba(10,10,11,0.72)");
  g.addColorStop(1, "rgba(10,10,11,0.97)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  brand(ctx);
  if (d.eyebrow) text(ctx, d.eyebrow.toUpperCase(), 20, 250, 9, { alpha: 0.55, spacing: 1.6 });
  drawHeroStat(ctx, d, 294, 310);
  footer(ctx, d, 342);
}

function drawRings(ctx: Ctx, d: ShareCardData) {
  rect(ctx, 0, 0, 200, 356, INK);
  glow(ctx, 100, 149, 116, RED, 0.2);
  brand(ctx);

  // Tre anelli concentrici: durata, calorie, costanza. Le frazioni sono indicative
  // del "quanto" — la card racconta, non certifica.
  const rings: [number, string, number][] = [
    [54, RED, Math.min(1, (d.durationMin ?? 0) / 60)],
    [40, "#30D158", Math.min(1, (d.calories ?? 0) / 500)],
    [26, "#5AC8FA", Math.min(1, (d.streakDays ?? 0) / 14)],
  ];
  for (const [r, color, frac] of rings) {
    ctx.save();
    ctx.lineWidth = x(11);
    ctx.lineCap = "round";
    ctx.strokeStyle = hexA(color, 0.16);
    ctx.beginPath();
    ctx.arc(x(100), x(148), x(r), 0, Math.PI * 2);
    ctx.stroke();
    if (frac > 0.01) {
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.arc(x(100), x(148), x(r), -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac);
      ctx.stroke();
    }
    ctx.restore();
  }

  if (d.eyebrow) text(ctx, d.eyebrow.toUpperCase(), 20, 240, 9, { alpha: 0.45, spacing: 1.6 });

  const rows: [string, string][] = [
    [RED, `${d.durationMin ?? 0} ${d.labels.min}`],
    ["#30D158", `${d.calories ?? 0} ${d.labels.kcal}`],
    ["#5AC8FA", `${d.streakDays ?? 0} ${d.labels.daysInARow.toLowerCase()}`],
  ];
  rows.forEach(([color, label], i) => {
    const ly = 260 + i * 18;
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x(24), x(ly - 4), x(3), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    text(ctx, label, 34, ly, 11);
  });

  footer(ctx, d, 338);
}

function drawRecord(ctx: Ctx, d: ShareCardData) {
  rect(ctx, 0, 0, 200, 356, INK);
  glow(ctx, 100, 164, 120, RED, 0.3);
  brand(ctx);

  text(ctx, d.labels.newRecord, 20, 112, 10, { color: RED, spacing: 2 });
  const kg = String(d.recordWeightKg ?? 0);
  text(ctx, kg, 20, 182, 64, { weight: 700, spacing: -3 });
  text(ctx, "kg", 20 + textW(ctx, kg, 64, 700, -3) + 8, 182, 16, { alpha: 0.55 });
  if (d.recordExercise) text(ctx, d.recordExercise, 20, 206, 15, { weight: 500 });

  if (d.recordDeltaKg != null && d.recordDeltaKg > 0) {
    const delta = `+${d.recordDeltaKg} kg`;
    const w = textW(ctx, delta, 11, 700) + 24;
    rect(ctx, 20, 224, w, 22, hexA("#30D158", 0.16), 11);
    text(ctx, delta, 32, 239, 11, { weight: 700, color: "#30D158" });
  }
  if (d.recordPrevious) text(ctx, d.recordPrevious, 20, 264, 10, { alpha: 0.45 });

  footer(ctx, d, 320);
}

function drawMonth(ctx: Ctx, d: ShareCardData) {
  rect(ctx, 0, 0, 200, 356, INK);
  brand(ctx);
  if (d.eyebrow) text(ctx, d.eyebrow.toUpperCase(), 20, 76, 9, { alpha: 0.45, spacing: 1.6 });

  // Griglia del mese: 7 colonne, una casella per giorno. È il colpo d'occhio della card.
  const days = d.monthDays ?? [];
  days.forEach((on, i) => {
    const col = i % 7;
    const row = Math.floor(i / 7);
    rect(ctx, 20 + col * 23, 94 + row * 23, 18, 18, on ? RED : white(0.09), 4);
  });

  const n = String(d.monthSessions ?? 0);
  text(ctx, n, 20, 250, 46, { weight: 700, spacing: -2 });
  text(ctx, d.labels.workouts, 20, 268, 10, { alpha: 0.75, spacing: 1.2 });
  text(ctx, `${d.monthHours ?? 0} ${d.labels.hours}`, 112, 250, 10, { alpha: 0.6 });
  text(ctx, `${fmtNum(d.monthCalories)} ${d.labels.kcal}`, 112, 264, 10, { alpha: 0.6 });

  footer(ctx, d, 320);
}

function drawMedal(ctx: Ctx, d: ShareCardData) {
  const color = d.medalColor ?? "#FF9F0A";
  rect(ctx, 0, 0, 200, 356, INK);
  glow(ctx, 100, 142, 110, color, 0.24);
  brand(ctx);

  drawHexMedal(ctx, 50, 84, color, d.medalIcon ?? "medal");

  text(ctx, d.labels.medalUnlocked, 100, 220, 9, { color, spacing: 1.8, align: "center" });
  if (d.medalTitle) text(ctx, d.medalTitle, 100, 243, 20, { weight: 700, align: "center", spacing: -0.3 });
  if (d.medalSubtitle) text(ctx, d.medalSubtitle, 100, 261, 10, { alpha: 0.5, align: "center" });

  footer(ctx, d, 336);
}

function drawCoach(ctx: Ctx, d: ShareCardData) {
  rect(ctx, 0, 0, 200, 356, INK);
  // La foto scende più in basso di dove finisce visivamente: la sfumatura diventa
  // nero pieno prima del taglio, così non si vede alcuna linea di stacco.
  const PHOTO_END = 215;
  if (d.photo) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, CARD_W, x(PHOTO_END));
    ctx.clip();
    coverImage(ctx, d.photo, PHOTO_END);
    ctx.restore();
  } else {
    rect(ctx, 0, 0, 200, PHOTO_END, "#232327");
  }
  // Sfumatura sotto la foto: il nome deve staccare sempre.
  const g = ctx.createLinearGradient(0, x(112), 0, x(205));
  g.addColorStop(0, "rgba(10,10,11,0)");
  g.addColorStop(0.55, "rgba(10,10,11,0.82)");
  g.addColorStop(1, "rgba(10,10,11,1)");
  ctx.fillStyle = g;
  ctx.fillRect(0, x(112), CARD_W, x(103));

  brand(ctx);
  if (d.coachName) text(ctx, d.coachName, 20, 176, 17, { weight: 700, spacing: -0.3 });
  if (d.coachRole) text(ctx, d.coachRole.toUpperCase(), 20, 208, 9, { alpha: 0.5, spacing: 1.4 });

  text(ctx, String(d.coachClients ?? 0), 20, 252, 26, { weight: 700, spacing: -1 });
  text(ctx, d.labels.athletes, 20, 266, 9, { alpha: 0.45 });
  text(ctx, String(d.coachSessions ?? 0), 100, 252, 26, { weight: 700, spacing: -1 });
  text(ctx, d.labels.workouts.toLowerCase(), 100, 266, 9, { alpha: 0.45 });

  // Unica CTA piena della famiglia: il PT si sta presentando, non riassumendo.
  if (d.coachCta) {
    rect(ctx, 20, 288, 160, 32, RED, 16);
    text(ctx, d.coachCta, 100, 308, 12, { weight: 700, align: "center" });
  }

  footer(ctx, d, 340, false);
}

// ── pezzi condivisi ──

/** Numero grande + unità. La streak batte i minuti: la disciplina si mostra meglio della durata. */
function drawHeroStat(ctx: Ctx, d: ShareCardData, ly: number, labelY: number) {
  const hasStreak = (d.streakDays ?? 0) > 1;
  const hero = hasStreak ? String(d.streakDays) : String(d.durationMin ?? 0);
  const heroLabel = hasStreak ? d.labels.daysInARow : d.labels.min.toUpperCase();
  text(ctx, hero, 20, ly, 46, { weight: 700, spacing: -2 });
  text(ctx, heroLabel, 20, labelY, 10, { alpha: 0.75, spacing: 1.2 });

  // Dati di contorno in colonna a destra, così non toccano mai il numero grande.
  const side: string[] = [];
  if (hasStreak && d.durationMin != null) side.push(`${d.durationMin} ${d.labels.min}`);
  if (d.calories) side.push(`${fmtNum(d.calories)} ${d.labels.kcal}`);
  if (side.length < 2 && d.exerciseCount != null) side.push(`${d.exerciseCount} ${d.labels.exercises}`);
  side.slice(0, 2).forEach((s, i) => text(ctx, s, 112, ly + i * 14, 10, { alpha: 0.6 }));
}

/** Esagono liquid-glass: stesse forme di <MedalBadge>, via medal-art. */
function drawHexMedal(ctx: Ctx, ox: number, oy: number, color: string, icon: string) {
  const [g0, g1] = GRAD[color] ?? [color, color];
  const gold = color === "#FFD60A";

  // Il viewBox della medaglia è 100×100 in unità logiche: scalo il contesto una volta
  // sola, così i path di medal-art si usano con le loro coordinate originali.
  ctx.save();
  ctx.translate(x(ox), x(oy));
  ctx.scale(S, S);

  const hex = new Path2D(HEX_PATH);
  const grad = ctx.createLinearGradient(0, 0, 0, 100);
  grad.addColorStop(0, g0);
  grad.addColorStop(1, g1);
  ctx.fillStyle = grad;
  ctx.fill(hex);
  ctx.strokeStyle = gold ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.55)";
  ctx.lineWidth = gold ? 2.4 : 2;
  ctx.stroke(hex);

  if (gold) {
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 0.8;
    ctx.stroke(new Path2D(HEX_INNER_PATH));
  }

  // Riflesso speculare in alto, tagliato dall'esagono.
  ctx.save();
  ctx.clip(hex);
  ctx.globalAlpha = gold ? 0.34 : 0.22;
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.ellipse(50, gold ? 17 : 18, gold ? 36 : 34, gold ? 15 : 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Glyph centrale
  ctx.save();
  ctx.translate(50, 54);
  ctx.scale(1.7, 1.7);
  drawPrims(ctx, glyphFor(icon));
  ctx.restore();

  ctx.restore();
}

// Coordinate grezze: il chiamante ha già scalato il contesto sul viewBox della medaglia.
function drawPrims(ctx: Ctx, prims: Prim[]) {
  for (const p of prims) {
    ctx.save();
    if (p.k === "path") {
      const path = new Path2D(p.d);
      if (p.fill) {
        ctx.fillStyle = p.fill;
        ctx.fill(path);
      }
      if (p.stroke) {
        ctx.strokeStyle = p.stroke;
        ctx.lineWidth = p.w ?? 1;
        if (p.round) {
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
        }
        ctx.stroke(path);
      }
    } else if (p.k === "circle") {
      ctx.beginPath();
      ctx.arc(p.cx, p.cy, p.r, 0, Math.PI * 2);
      if (p.fill) {
        ctx.fillStyle = p.fill;
        ctx.fill();
      }
      if (p.stroke) {
        ctx.strokeStyle = p.stroke;
        ctx.lineWidth = p.w ?? 1;
        ctx.stroke();
      }
    } else if (p.k === "rect") {
      ctx.beginPath();
      ctx.roundRect(p.x, p.y, p.w, p.h, p.r ?? 0);
      if (p.fill) {
        ctx.fillStyle = p.fill;
        ctx.fill();
      }
      if (p.stroke) {
        ctx.strokeStyle = p.stroke;
        ctx.lineWidth = p.sw ?? 1;
        ctx.stroke();
      }
    } else {
      ctx.strokeStyle = p.stroke;
      ctx.lineWidth = p.w;
      if (p.round) ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(p.x1, p.y1);
      ctx.lineTo(p.x2, p.y2);
      ctx.stroke();
    }
    ctx.restore();
  }
}

/** Disegna l'immagine riempiendo la tela senza deformarla (come object-fit: cover). */
function coverImage(ctx: Ctx, img: CanvasImageSource, logicalH = 356) {
  const iw = "width" in img && typeof img.width === "number" ? img.width : CARD_W;
  const ih = "height" in img && typeof img.height === "number" ? img.height : CARD_H;
  const targetH = x(logicalH);
  const scale = Math.max(CARD_W / iw, targetH / ih);
  const w = iw * scale;
  const h = ih * scale;
  ctx.drawImage(img, (CARD_W - w) / 2, (targetH - h) / 2, w, h);
}

/** Migliaia separate da un punto sottile: "12.400" si legge, "12400" no. */
function fmtNum(n?: number) {
  return String(Math.round(n ?? 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

const DRAW: Record<ShareVariant, (ctx: Ctx, d: ShareCardData) => void> = {
  photo: drawPhoto,
  rings: drawRings,
  record: drawRecord,
  month: drawMonth,
  medal: drawMedal,
  coach: drawCoach,
};

/**
 * Disegna la card sul canvas passato, a piena risoluzione (1080×1920) o ridotta.
 * `width` serve alle anteprime: disegnarne quattro a piena risoluzione costerebbe
 * 8 megapixel di memoria per mostrarle grandi un pollice.
 */
export function drawShareCard(canvas: HTMLCanvasElement, data: ShareCardData, width = CARD_W) {
  const scale = width / CARD_W;
  canvas.width = Math.round(CARD_W * scale);
  canvas.height = Math.round(CARD_H * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.scale(scale, scale);
  DRAW[data.variant](ctx, data);
  ctx.restore();
}

export function cardToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/png", 0.95));
}
