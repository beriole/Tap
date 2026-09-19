/**
 * Floraux au trait du theme Romantic : pivoines, boutons et feuilles,
 * calcules en SVG (une couleur, trait fin). Aucune image, aucun clipart.
 *
 * Une pivoine = trois couronnes de petales en festons qui se chevauchent,
 * un coeur en spirale. `ro-draw` dessine le trait a l ouverture (regle posee
 * dans le theme).
 */

type Pt = [number, number];
const r1 = (n: number) => Math.round(n * 10) / 10;
const rad = (d: number) => (d * Math.PI) / 180;
const polar = (cx: number, cy: number, r: number, deg: number): Pt => [cx + r * Math.cos(rad(deg)), cy + r * Math.sin(rad(deg))];
const P = (p: Pt) => `${r1(p[0])} ${r1(p[1])}`;

function leaf(x: number, y: number, angle: number, len: number, width: number): string {
  const [tx, ty] = polar(x, y, len, angle);
  const [mx, my] = polar(x, y, len * 0.45, angle);
  const nx = -Math.sin(rad(angle));
  const ny = Math.cos(rad(angle));
  return `M${r1(x)} ${r1(y)}Q${r1(mx + nx * width)} ${r1(my + ny * width)} ${r1(tx)} ${r1(ty)}Q${r1(mx - nx * width)} ${r1(my - ny * width)} ${r1(x)} ${r1(y)}Z`;
}

/** Pivoine vue de face : festons superposes sur trois couronnes. */
function peony(cx: number, cy: number, r: number, rot = 0): string[] {
  const out: string[] = [];
  const rings = [
    { k: 1, n: 7, off: 10 },
    { k: 0.7, n: 6, off: 38 },
    { k: 0.44, n: 5, off: 4 },
  ];
  for (const ring of rings) {
    const R = r * ring.k;
    const span = 360 / ring.n;
    for (let i = 0; i < ring.n; i++) {
      const a0 = rot + ring.off + i * span - span * 0.08;
      const a1 = a0 + span * 1.16;
      const s = polar(cx, cy, R * 0.52, a0);
      const c1 = polar(cx, cy, R * 1.12, a0 + span * 0.08);
      const c2 = polar(cx, cy, R * 1.12, a1 - span * 0.08);
      const e = polar(cx, cy, R * 0.52, a1);
      out.push(`M${P(s)}C${P(c1)} ${P(c2)} ${P(e)}`);
    }
  }
  // Coeur : une petite spirale.
  const heart: string[] = [];
  for (let t = 0; t <= 540; t += 30) heart.push(P(polar(cx, cy, r * 0.05 + (t / 540) * r * 0.16, rot + t)));
  out.push(`M${heart.join("L")}`);
  return out;
}

/** Bouton de rose ferme, sur sa tige courte. */
function bud(x: number, y: number, angle: number, len: number): string[] {
  const tip = polar(x, y, len, angle);
  const base = polar(x, y, len * 0.35, angle);
  return [
    leaf(base[0], base[1], angle, len * 0.65, len * 0.34),
    leaf(base[0], base[1], angle - 28, len * 0.4, len * 0.1),
    leaf(base[0], base[1], angle + 28, len * 0.4, len * 0.1),
    `M${r1(x)} ${r1(y)}L${P(base)}`,
    `M${P(polar(base[0], base[1], len * 0.3, angle))}Q${P(polar(tip[0], tip[1], len * 0.12, angle + 150))} ${P(tip)}`,
  ];
}

function spray(): string[] {
  const out: string[] = [];
  // Tiges
  out.push("M8 212C40 170 70 140 118 104", "M70 142C74 110 70 82 58 52", "M96 122C128 118 160 126 196 150", "M40 176C30 158 18 150 6 146");
  out.push(...peony(128, 94, 40, 12));
  out.push(...peony(56, 46, 22, 40));
  out.push(...bud(196, 150, 25, 30));
  out.push(...bud(6, 146, 200, 24));
  const leaves: [number, number, number, number, number][] = [
    [30, 186, -150, 30, 10],
    [52, 164, -60, 34, 11],
    [86, 130, 170, 30, 10],
    [70, 110, -150, 26, 9],
    [64, 80, 200, 22, 8],
    [140, 126, 70, 30, 10],
    [168, 136, -40, 28, 9],
    [180, 142, 60, 22, 8],
    [98, 118, 100, 22, 8],
  ];
  for (const [x, y, a, l, w] of leaves) out.push(leaf(x, y, a, l, w), `M${r1(x)} ${r1(y)}L${P(polar(x, y, l * 0.75, a))}`);
  return out;
}
const SPRAY = spray();

export function Spray({ className, draw }: { className?: string; draw?: boolean }) {
  return (
    <svg aria-hidden viewBox="0 0 220 220" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {SPRAY.map((d, i) => (
        <path key={i} d={d} pathLength={draw ? 1 : undefined} className={draw ? "ro-draw" : undefined} style={draw ? ({ "--i": i } as React.CSSProperties) : undefined} />
      ))}
      {[[26, 200], [34, 206], [18, 204]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="1.8" fill="currentColor" stroke="none" />
      ))}
    </svg>
  );
}

const SMALL = [...peony(20, 20, 14, 20)];

/** Une pivoine seule, en fleuron de rubrique. */
export function Bloom({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" className={className}>
      {SMALL.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}

/** Le cercle trace a la main autour du jour, sur le calendrier. */
export function Loop({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 60 50" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" className={className}>
      <path pathLength={1} className="ro-draw" style={{ "--i": 8 } as React.CSSProperties} d="M44 8C34 2 12 4 6 18C0 34 20 46 36 44C52 42 60 28 52 16C46 8 34 6 26 8" />
    </svg>
  );
}
