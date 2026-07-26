// Geometria delle medaglie BYH, in forma di dati.
// Serve DUE renderer diversi con le stesse identiche forme:
//   • <MedalBadge> nell'app (SVG)
//   • la card da condividere (Canvas 2D)
// Tenerle qui evita che le due versioni divergano nel tempo.

export type Prim =
  | { k: "path"; d: string; fill?: string; stroke?: string; w?: number; round?: boolean }
  | { k: "circle"; cx: number; cy: number; r: number; fill?: string; stroke?: string; w?: number }
  | { k: "rect"; x: number; y: number; w: number; h: number; r?: number; fill?: string; stroke?: string; sw?: number }
  | { k: "line"; x1: number; y1: number; x2: number; y2: number; stroke: string; w: number; round?: boolean };

// Contorno esagonale della medaglia (viewBox 100×100).
export const HEX_PATH = "M50 3 L91 26 L91 74 L50 97 L9 74 L9 26 Z";
// Cornice interna, solo livello oro.
export const HEX_INNER_PATH = "M50 6 L88 27 L88 73 L50 94 L12 73 L12 27 Z";

// Colore accento → [stop alto, stop basso] del gradiente.
export const GRAD: Record<string, [string, string]> = {
  "#FF375F": ["#FF375F", "#B32842"],
  "#FF9F0A": ["#FF9F0A", "#B27007"],
  "#5AC8FA": ["#5AC8FA", "#3F8CAF"],
  "#BF5AF2": ["#BF5AF2", "#853FA9"],
  "#FFD60A": ["#FFE767", "#B2960A"], // oro: alto più chiaro
  "#30D158": ["#30D158", "#21913D"],
};

const W = "#FFFFFF";

// Simbolo centrale per ciascun traguardo (chiave = medal.icon).
// Coordinate centrate sull'origine, da disegnare con translate(50,54) scale(1.7).
export const GLYPHS: Record<string, Prim[]> = {
  flag: [
    { k: "path", d: "M-6,-11 L-6,11", stroke: W, w: 2.2, round: true },
    { k: "path", d: "M-6,-11 L8,-11 L4,-5 L8,1 L-6,1 Z", fill: W },
  ],
  flame: [
    {
      k: "path",
      d: "M0,-11 C4,-6 6,-2 4,3 C7,1 8,-3 7,-6 C10,-2 11,4 7,8 C9,7 10,5 10,3 C11,9 6,12 0,12 C-6,12 -10,8 -9,2 C-9,5 -8,7 -6,8 C-9,4 -8,-1 -5,-4 C-5,-1 -4,1 -2,2 C-3,-3 -2,-8 0,-11 Z",
      fill: W,
    },
  ],
  medal: [
    { k: "path", d: "M-4,-12 L-1,-2 L1,-2 L4,-12", stroke: W, w: 2, round: true },
    { k: "circle", cx: 0, cy: 4, r: 8, stroke: W, w: 2.4 },
    { k: "circle", cx: 0, cy: 4, r: 3.2, fill: W },
  ],
  award: [
    { k: "circle", cx: 0, cy: -3, r: 7, stroke: W, w: 2.3 },
    { k: "path", d: "M-4,3 L-7,13 L-1,10 Z", fill: W },
    { k: "path", d: "M4,3 L7,13 L1,10 Z", fill: W },
    { k: "circle", cx: 0, cy: -3, r: 2.6, fill: W },
  ],
  trophy: [
    { k: "path", d: "M-6,-11 L6,-11 L6,-4 C6,1 3,4 0,4 C-3,4 -6,1 -6,-4 Z", fill: W },
    { k: "path", d: "M-6,-9 C-10,-9 -10,-2 -6,-2", stroke: W, w: 1.8 },
    { k: "path", d: "M6,-9 C10,-9 10,-2 6,-2", stroke: W, w: 1.8 },
    { k: "rect", x: -1.5, y: 4, w: 3, h: 4, fill: W },
    { k: "rect", x: -5, y: 8, w: 10, h: 2.4, r: 1, fill: W },
  ],
  "calendar-check": [
    { k: "rect", x: -9, y: -9, w: 18, h: 18, r: 3, stroke: W, sw: 2.2 },
    { k: "line", x1: -9, y1: -3, x2: 9, y2: -3, stroke: W, w: 2 },
    { k: "line", x1: -4.5, y1: -12, x2: -4.5, y2: -9, stroke: W, w: 2, round: true },
    { k: "line", x1: 4.5, y1: -12, x2: 4.5, y2: -9, stroke: W, w: 2, round: true },
    { k: "path", d: "M-4,3 L-1,6.5 L5,-1", stroke: W, w: 2.4, round: true },
  ],
  star: [{ k: "path", d: "M0,-12 L3.5,-4.2 L11.4,-3.7 L5.4,1.7 L7.3,9.5 L0,5.1 L-7.3,9.5 L-5.4,1.7 L-11.4,-3.7 L-3.5,-4.2 Z", fill: W }],
  crown: [
    { k: "path", d: "M-9,4 L-9,-3 L-4.5,1 L0,-7 L4.5,1 L9,-3 L9,4 Z", fill: W },
    { k: "rect", x: -9, y: 4, w: 18, h: 3, r: 1, fill: W },
    { k: "circle", cx: -9, cy: -4.5, r: 1.6, fill: W },
    { k: "circle", cx: 0, cy: -8.5, r: 1.8, fill: W },
    { k: "circle", cx: 9, cy: -4.5, r: 1.6, fill: W },
  ],
  zap: [{ k: "path", d: "M2,-12 L-8,2 L-1,2 L-3,12 L9,-3 L2,-3 Z", fill: W }],
  gem: [
    { k: "path", d: "M-8,-5 L8,-5 L11,0 L0,12 L-11,0 Z", fill: W },
    { k: "path", d: "M-8,-5 L-3,0 L0,12 M8,-5 L3,0 L0,12 M-11,0 L11,0", stroke: "rgba(0,0,0,0.15)", w: 0.8 },
    { k: "path", d: "M-8,-5 L0,-9 L8,-5", stroke: "rgba(255,255,255,0.5)", w: 0.8 },
  ],
};

export const LOCK_GLYPH: Prim[] = [
  { k: "rect", x: -5.5, y: -1, w: 11, h: 9, r: 2, fill: "#8E8E93" },
  { k: "path", d: "M-3.5,-1 L-3.5,-4.5 C-3.5,-7 -1.8,-8.5 0,-8.5 C1.8,-8.5 3.5,-7 3.5,-4.5 L3.5,-1", stroke: "#8E8E93", w: 2 },
  { k: "circle", cx: 0, cy: 3.2, r: 1.4, fill: "#F2F2F7" },
];

export function glyphFor(icon: string): Prim[] {
  return GLYPHS[icon] ?? GLYPHS.medal;
}
