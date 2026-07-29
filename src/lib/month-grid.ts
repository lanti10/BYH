// Intensità dei giorni nella griglia del mese.
//
// Il problema: con soglie fisse ("6 atleti = massimo") un PT con quaranta clienti
// avrebbe la griglia tutta rossa piena e la card non racconterebbe niente. Le soglie
// si calcolano quindi SUL MESE di quel trainer, e il livello massimo è riservato ai
// picchi veri: se la squadra si allena in modo costante non compare affatto.

export type DayLevel = 0 | 1 | 2 | 3; // spento · normale · sopra la media · punta

function percentile(sortedAsc: number[], p: number): number {
  if (sortedAsc.length === 0) return 0;
  const i = Math.min(sortedAsc.length - 1, Math.floor((sortedAsc.length - 1) * p));
  return sortedAsc[i];
}

/**
 * Da quanti allenamenti ha fatto la squadra ogni giorno, al livello da colorare.
 *
 * Un giorno sale di livello solo se soddisfa DUE condizioni: stare nella parte alta
 * del mese (percentile) e superare la mediana di un margine assoluto. La percentuale
 * da sola non basterebbe — un 10% di giorni migliori esiste sempre, anche quando i
 * giorni sono tutti uguali, e finirebbe per accendersi senza motivo.
 */
export function dayLevels(countsPerDay: number[]): DayLevel[] {
  const active = countsPerDay.filter((c) => c > 0).sort((a, b) => a - b);
  if (active.length === 0) return countsPerDay.map(() => 0);

  const median = percentile(active, 0.5);
  const peak = Math.max(percentile(active, 0.9), median + 2);
  const above = Math.max(percentile(active, 0.6), median + 1);

  return countsPerDay.map((c) => {
    if (c <= 0) return 0;
    if (c >= peak) return 3;
    if (c >= above) return 2;
    return 1;
  });
}
