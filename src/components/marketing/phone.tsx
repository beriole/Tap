import { NfcWaves } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

const VIEWPORT_WIDTH = 390;

/**
 * Chassis de telephone.
 *
 * Il contient un profil rendu a sa taille reelle (390 px) puis mis a l echelle :
 * on montre donc le produit tel qu il s affiche, sans refaire une maquette qui
 * divergerait du code des le premier changement de theme.
 */
export function PhoneFrame({
  width = 288,
  height = 580,
  children,
  className,
}: {
  width?: number;
  height?: number;
  children: React.ReactNode;
  className?: string;
}) {
  const scale = width / VIEWPORT_WIDTH;

  return (
    <div
      className={cn(
        "relative rounded-[2.6rem] border border-white/12 bg-[#05070b] p-2 shadow-[var(--shadow-hero)]",
        className,
      )}
      style={{ width: width + 16 }}
    >
      {/* Encoche */}
      <div
        aria-hidden
        className="absolute left-1/2 top-3.5 z-20 h-5 w-20 -translate-x-1/2 rounded-full bg-[#05070b]"
      />

      <div
        className="relative overflow-hidden rounded-[2.1rem] bg-white"
        style={{ width, height }}
      >
        <div
          className="origin-top-left"
          style={{
            width: VIEWPORT_WIDTH,
            height: height / scale,
            transform: `scale(${scale})`,
          }}
        >
          {children}
        </div>

        {/* Fondu bas : la page continue, on ne la coupe pas net. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/45 to-transparent"
        />
      </div>
    </div>
  );
}

/** Les ondes du sans-contact, a l echelle du heros. */
export function RippleArcs({ className }: { className?: string }) {
  return <NfcWaves animated strokeWidth={1.5} className={cn("text-[var(--brand-signal)]", className)} />;
}

/** La carte physique, vue de trois quarts. */
export function CardObject({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative h-[8.5rem] w-[13.5rem] rounded-2xl border border-white/10 p-4",
        "bg-gradient-to-br from-[#1c222e] via-[#12161f] to-[#0a0d13] shadow-[var(--shadow-hero)]",
        className,
      )}
    >
      <div className="eyebrow text-[var(--brand-copper)]">Tap</div>
      <div className="absolute bottom-4 left-4 space-y-2">
        <div className="h-1.5 w-20 rounded-full bg-white/18" />
        <div className="h-1.5 w-12 rounded-full bg-white/10" />
      </div>
      <NfcWaves className="absolute bottom-4 right-4 size-5 text-white/35" />
    </div>
  );
}
