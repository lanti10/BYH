// Anelli di attività concentrici stile Apple Fitness (SVG puro).
export type RingSpec = { value: number; goal: number; color: string; track: string };

export function ActivityRings({
  rings,
  size = 176,
}: {
  rings: RingSpec[]; // dal più esterno al più interno
  size?: number;
}) {
  const stroke = size * 0.1;
  const gap = stroke * 0.42;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90 shrink-0">
      {rings.map((r, i) => {
        const radius = size / 2 - stroke / 2 - i * (stroke + gap);
        const circ = 2 * Math.PI * radius;
        const pct = r.goal > 0 ? Math.min(r.value / r.goal, 1) : 0;
        return (
          <g key={i}>
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={r.track} strokeWidth={stroke} />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={r.color}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={circ * (1 - pct)}
              style={{ transition: "stroke-dashoffset .7s cubic-bezier(.4,0,.2,1)" }}
            />
          </g>
        );
      })}
    </svg>
  );
}
