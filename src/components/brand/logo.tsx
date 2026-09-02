import { cn } from "@/lib/utils";

/**
 * Geometrie des ondes du sans-contact.
 *
 * Trois arcs concentriques ouverts vers la droite, dans un repere 24x24 - la
 * meme construction que le pictogramme NFC universel. Tout le site la reutilise
 * pour n avoir qu un seul motif a tenir.
 */
export const NFC_ARCS = [
  { d: "M7 8a8 8 0 0 1 0 8", width: 1.9 },
  { d: "M11 5a13 13 0 0 1 0 14", width: 1.9 },
  { d: "M15 2a18 18 0 0 1 0 20", width: 1.9 },
];

export function NfcWaves({
  className,
  animated = false,
  strokeWidth,
}: {
  className?: string;
  animated?: boolean;
  strokeWidth?: number;
}) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      {NFC_ARCS.map((arc, i) => (
        <path
          key={arc.d}
          d={arc.d}
          stroke="currentColor"
          strokeWidth={strokeWidth ?? arc.width}
          strokeLinecap="round"
          className={animated ? "ripple-arc" : undefined}
          style={
            animated
              ? { animationDelay: `${i * 0.3}s`, transformOrigin: "left center" }
              : { opacity: 1 - i * 0.28 }
          }
        />
      ))}
    </svg>
  );
}

/**
 * La marque : une carte, et le signal qui en part.
 *
 * Le geste du produit reduit a son minimum. Le meme motif sert de signature en
 * grand dans le heros, ce qui evite de tenir deux vocabulaires graphiques.
 */
export function LogoMark({
  className,
  animated = false,
  // Couleur des traits GRAVES dans la carte. La carte prend currentColor : sur
  // fond clair elle est encre, les traits doivent donc etre papier, et
  // inversement. Sans cela la marque se referme en carre plein.
  lineColor = "var(--brand-ink)",
}: {
  className?: string;
  animated?: boolean;
  lineColor?: string;
}) {
  return (
    <svg viewBox="0 0 40 32" fill="none" aria-hidden className={cn("h-7 w-auto", className)}>
      {/* La carte */}
      <rect x="1.5" y="6" width="19" height="20" rx="3.5" fill="currentColor" />
      <path
        d="M6 12h8M6 16h10M6 20h6"
        stroke={lineColor}
        strokeWidth="1.7"
        strokeLinecap="round"
        opacity="0.45"
      />

      {/* Le signal, cale sur le bord droit de la carte */}
      <g transform="translate(20 4) scale(1)">
        {NFC_ARCS.map((arc, i) => (
          <path
            key={arc.d}
            d={arc.d}
            stroke="var(--brand-signal)"
            strokeWidth="2"
            strokeLinecap="round"
            className={animated ? "ripple-arc" : undefined}
            style={
              animated
                ? { animationDelay: `${i * 0.3}s`, transformOrigin: "left center" }
                : { opacity: 1 - i * 0.26 }
            }
          />
        ))}
      </g>
    </svg>
  );
}

export function Wordmark({
  className,
  tone = "light",
}: {
  className?: string;
  tone?: "light" | "dark";
}) {
  return (
    <span
      className={cn(
        "flex items-center gap-2.5 font-[family-name:var(--font-grotesk)] text-[1.1rem] font-bold tracking-[-0.03em]",
        tone === "light" ? "text-[var(--brand-paper)]" : "text-[var(--brand-ink)]",
        className,
      )}
    >
      <LogoMark className="h-6" lineColor={tone === "light" ? "var(--brand-ink)" : "var(--brand-paper)"} />
      Tap
    </span>
  );
}
