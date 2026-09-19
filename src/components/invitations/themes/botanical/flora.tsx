import { cn } from "@/lib/utils";

/**
 * Herbier au trait : les dessins du theme Botanical.
 *
 * Aucune image, aucun clipart : chaque feuille est calculee (une amande, deux
 * courbes quadratiques) et posee le long d une tige de Bezier. Le trait est
 * fin et d une seule couleur (currentColor) ; les planches se lisent comme un
 * croquis de botaniste, pas comme une decoration de papeterie.
 *
 * `bt-draw` : le trait se dessine a l ouverture (pathLength = 1). La regle
 * est posee dans le theme ; sous pli elle attend, en mouvement reduit elle
 * saute directement a l etat final.
 */

type Pt = [number, number];

const r1 = (n: number) => Math.round(n * 10) / 10;
const rad = (deg: number) => (deg * Math.PI) / 180;

/** Une feuille en amande : base (x, y), orientation en degres, longueur, largeur. */
export function leafPath(x: number, y: number, angle: number, len: number, width: number): string {
  const a = rad(angle);
  const tx = x + Math.cos(a) * len;
  const ty = y + Math.sin(a) * len;
  const nx = -Math.sin(a);
  const ny = Math.cos(a);
  const mx = x + Math.cos(a) * len * 0.45;
  const my = y + Math.sin(a) * len * 0.45;
  return `M${r1(x)} ${r1(y)}Q${r1(mx + nx * width)} ${r1(my + ny * width)} ${r1(tx)} ${r1(ty)}Q${r1(mx - nx * width)} ${r1(my - ny * width)} ${r1(x)} ${r1(y)}Z`;
}

/** Nervure centrale d une feuille (des 3/4 de sa longueur). */
function ribPath(x: number, y: number, angle: number, len: number): string {
  const a = rad(angle);
  return `M${r1(x)} ${r1(y)}L${r1(x + Math.cos(a) * len * 0.78)} ${r1(y + Math.sin(a) * len * 0.78)}`;
}

function cubic(p: [Pt, Pt, Pt, Pt], t: number): { pt: Pt; angle: number } {
  const [a, b, c, d] = p;
  const u = 1 - t;
  const x = u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0];
  const y = u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1];
  const dx = 3 * u * u * (b[0] - a[0]) + 6 * u * t * (c[0] - b[0]) + 3 * t * t * (d[0] - c[0]);
  const dy = 3 * u * u * (b[1] - a[1]) + 6 * u * t * (c[1] - b[1]) + 3 * t * t * (d[1] - c[1]);
  return { pt: [x, y], angle: (Math.atan2(dy, dx) * 180) / Math.PI };
}

const curve = (p: [Pt, Pt, Pt, Pt]) => `M${p[0].join(" ")}C${p[1].join(" ")} ${p[2].join(" ")} ${p[3].join(" ")}`;

/** Feuilles alternees le long d une tige. */
function leavesAlong(stem: [Pt, Pt, Pt, Pt], opts: { from: number; to: number; count: number; spread: number; len: [number, number]; ratio: number; ribs?: boolean }): string[] {
  const out: string[] = [];
  for (let i = 0; i < opts.count; i++) {
    const t = opts.from + ((opts.to - opts.from) * i) / Math.max(1, opts.count - 1);
    const { pt, angle } = cubic(stem, t);
    const side = i % 2 === 0 ? 1 : -1;
    const len = opts.len[0] + (opts.len[1] - opts.len[0]) * (i / Math.max(1, opts.count - 1));
    const a = angle + side * opts.spread;
    out.push(leafPath(pt[0], pt[1], a, len, len * opts.ratio));
    if (opts.ribs && i % 2 === 0) out.push(ribPath(pt[0], pt[1], a, len));
  }
  return out;
}

function Drawing({ paths, viewBox, className, strokeWidth = 1, draw, dots }: { paths: string[]; viewBox: string; className?: string; strokeWidth?: number; draw?: boolean; dots?: Pt[] }) {
  return (
    <svg aria-hidden viewBox={viewBox} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      {paths.map((d, i) => (
        <path key={i} d={d} pathLength={draw ? 1 : undefined} className={draw ? "bt-draw" : undefined} style={draw ? ({ "--i": i } as React.CSSProperties) : undefined} />
      ))}
      {dots?.map(([x, y], i) => <circle key={`d${i}`} cx={x} cy={y} r="2.2" fill="currentColor" stroke="none" />)}
    </svg>
  );
}

// ---------------------------------------------------------------- planches --

const BRANCH_STEM: [Pt, Pt, Pt, Pt] = [[78, 418], [44, 300], [112, 170], [66, 12]];
const BRANCH_SIDE: [Pt, Pt, Pt, Pt] = [[70, 262], [40, 236], [22, 200], [18, 150]];
const BRANCH = [
  curve(BRANCH_STEM),
  ...leavesAlong(BRANCH_STEM, { from: 0.1, to: 0.97, count: 13, spread: 52, len: [40, 18], ratio: 0.36, ribs: true }),
  curve(BRANCH_SIDE),
  ...leavesAlong(BRANCH_SIDE, { from: 0.35, to: 1, count: 4, spread: 70, len: [17, 13], ratio: 0.9 }),
];

/** Grande branche de saule et d eucalyptus : la tige du premier ecran. */
export function Branch({ className, draw }: { className?: string; draw?: boolean }) {
  return <Drawing paths={BRANCH} viewBox="0 0 140 420" className={className} strokeWidth={1.1} draw={draw} dots={[[60, 22], [74, 30], [54, 40]]} />;
}

function wreath(): string[] {
  const cx = 120;
  const cy = 120;
  const R = 92;
  const out: string[] = [];
  const at = (deg: number): Pt => [cx + R * Math.cos(rad(deg)), cy + R * Math.sin(rad(deg))];
  // Deux demi-couronnes qui partent du bas et se rejoignent en haut.
  const l0 = at(104);
  const l1 = at(262);
  const r0 = at(76);
  const r1_ = at(-82);
  out.push(`M${r1(l0[0])} ${r1(l0[1])}A${R} ${R} 0 0 1 ${r1(l1[0])} ${r1(l1[1])}`);
  out.push(`M${r1(r0[0])} ${r1(r0[1])}A${R} ${R} 0 0 0 ${r1(r1_[0])} ${r1(r1_[1])}`);
  const n = 11;
  for (let i = 0; i < n; i++) {
    const tl = 110 + (i * 146) / (n - 1);
    const tr = 70 - (i * 146) / (n - 1);
    const len = 22 - i * 0.7;
    const side = i % 2 === 0 ? 1 : -1;
    const [lx, ly] = at(tl);
    const [rx, ry] = at(tr);
    out.push(leafPath(lx, ly, tl + 90 + side * 38, len, len * 0.4));
    out.push(leafPath(rx, ry, tr - 90 - side * 38, len, len * 0.4));
  }
  return out;
}
const WREATH = wreath();

/** Couronne ouverte : le quantieme se pose au milieu. */
export function Wreath({ className }: { className?: string }) {
  return <Drawing paths={WREATH} viewBox="0 0 240 240" className={className} strokeWidth={1} dots={[[120, 214], [112, 218], [128, 218]]} />;
}

function anemone(): string[] {
  const cx = 70;
  const cy = 58;
  const out: string[] = [];
  for (let i = 0; i < 6; i++) out.push(leafPath(cx, cy, i * 60 - 75, 44, 30));
  out.push(`M${cx + 9} ${cy}A9 9 0 1 1 ${cx + 8.99} ${cy - 0.4}`);
  for (let i = 0; i < 14; i++) {
    const a = rad(i * (360 / 14));
    out.push(`M${r1(cx + Math.cos(a) * 12)} ${r1(cy + Math.sin(a) * 12)}L${r1(cx + Math.cos(a) * 16)} ${r1(cy + Math.sin(a) * 16)}`);
  }
  const stem: [Pt, Pt, Pt, Pt] = [[cx, cy + 40], [cx + 4, cy + 90], [cx - 18, cy + 120], [cx - 10, cy + 170]];
  out.push(curve(stem));
  out.push(leafPath(cx - 4, cy + 104, 200, 38, 12), ribPath(cx - 4, cy + 104, 200, 38));
  out.push(leafPath(cx - 12, cy + 138, -20, 30, 10));
  return out;
}
const ANEMONE = anemone();

/** Une anemone ouverte, pour le mot des maries. */
export function Anemone({ className }: { className?: string }) {
  return <Drawing paths={ANEMONE} viewBox="0 0 140 230" className={className} strokeWidth={1} />;
}

const SPRIG_STEM: [Pt, Pt, Pt, Pt] = [[4, 44], [14, 30], [26, 20], [44, 6]];
const SPRIG = [curve(SPRIG_STEM), ...leavesAlong(SPRIG_STEM, { from: 0.25, to: 0.95, count: 4, spread: 55, len: [15, 10], ratio: 0.38 })];

/** Petit rameau : marque un titre de rubrique sur la tige. */
export function Sprig({ className }: { className?: string }) {
  return <Drawing paths={SPRIG} viewBox="0 0 48 48" className={cn("overflow-visible", className)} strokeWidth={1.1} />;
}

const FERN_STEM: [Pt, Pt, Pt, Pt] = [[20, 300], [30, 200], [70, 110], [150, 30]];
const FERN = [curve(FERN_STEM), ...leavesAlong(FERN_STEM, { from: 0.06, to: 0.98, count: 22, spread: 78, len: [30, 8], ratio: 0.26 })];

/** Fougere : elle deborde du cadre de la photo. */
export function Fern({ className }: { className?: string }) {
  return <Drawing paths={FERN} viewBox="0 0 170 310" className={className} strokeWidth={1} />;
}

function bouquet(): string[] {
  const stems: [Pt, Pt, Pt, Pt][] = [
    [[80, 150], [78, 110], [60, 70], [40, 30]],
    [[80, 150], [82, 100], [84, 60], [86, 14]],
    [[80, 150], [86, 112], [104, 76], [128, 40]],
  ];
  const out = stems.map(curve);
  out.push(...leavesAlong(stems[0]!, { from: 0.3, to: 1, count: 5, spread: 55, len: [20, 12], ratio: 0.38 }));
  out.push(...leavesAlong(stems[2]!, { from: 0.3, to: 1, count: 5, spread: 55, len: [20, 12], ratio: 0.38 }));
  out.push(...leavesAlong(stems[1]!, { from: 0.5, to: 1, count: 4, spread: 60, len: [12, 9], ratio: 0.9 }));
  return out;
}
const BOUQUET = bouquet();

/** Trois tiges nouees : la signature du pied de page. */
export function Bouquet({ className }: { className?: string }) {
  return <Drawing paths={BOUQUET} viewBox="0 0 170 160" className={className} strokeWidth={1.1} dots={[[86, 10], [80, 16], [92, 17]]} />;
}
