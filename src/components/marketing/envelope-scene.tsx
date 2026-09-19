import { cn } from "@/lib/utils";

/**
 * Le pli qui s ouvre au DEFILEMENT (vitrine).
 *
 * Meme construction que l enveloppe de l invitation (corps, rabat, carton,
 * cachet), mais ici rien ne se joue au clic : la scene avance avec la page,
 * par animation-timeline (globals.css, .mk-scene). Le lecteur decouvre
 * l ouverture en faisant defiler ; s il remonte, le pli se referme.
 *
 * Aucune image : papier, ombres et cachet sont du CSS.
 */
export function EnvelopeScene({
  monogram,
  hosts,
  recipient,
  date,
  className,
}: {
  monogram: string;
  hosts: string;
  recipient: string;
  date: string;
  className?: string;
}) {
  return (
    <div className={cn("relative w-[min(78vw,340px)] [perspective:1400px]", className)}>
      {/* Le carton, glisse dans le pli. */}
      <div aria-hidden className="mk-card absolute inset-x-[6.5%] top-[5%] z-10 flex aspect-[3/2.05] flex-col items-center justify-center bg-[#FBF7EF] text-[#2B231F] shadow-[0_18px_30px_-22px_rgba(0,0,0,0.6)]">
        <span className="grain absolute inset-0 opacity-[0.1] mix-blend-multiply" />
        <span className="absolute inset-[7px] border border-[#B08D57]/40" />
        <span className="relative text-[10px] uppercase tracking-[0.32em] text-[#7A5D33]">Nous nous marions</span>
        <span className="relative mt-2 font-[family-name:var(--app-font-display)] text-[clamp(22px,6vw,28px)] leading-none">{hosts}</span>
        <span className="relative mt-3 text-[10px] uppercase tracking-[0.28em] text-[#675B52]">{date}</span>
      </div>

      {/* Le corps du pli. */}
      <span aria-hidden className="relative z-20 block aspect-[3/2] w-full overflow-hidden bg-[#EAE0CC] shadow-[0_2px_2px_-1px_rgba(0,0,0,0.1),0_40px_70px_-30px_rgba(0,0,0,0.7)]">
        <span className="grain absolute inset-0 opacity-[0.16] mix-blend-multiply" />
        <span className="absolute inset-0 bg-[#E2D6BF] [clip-path:polygon(0_0,50%_58%,0_100%)]" />
        <span className="absolute inset-0 bg-[#E2D6BF] [clip-path:polygon(100%_0,50%_58%,100%_100%)]" />
        <span className="absolute inset-0 bg-[#EAE0CC] [clip-path:polygon(0_100%,50%_52%,100%_100%)]" />
        <span className="absolute inset-0 opacity-50 [background:linear-gradient(to_bottom,rgba(0,0,0,0.1),transparent_22%)] [clip-path:polygon(0_100%,50%_52%,100%_100%)]" />
        <span className="absolute bottom-[12%] left-1/2 -translate-x-1/2 whitespace-nowrap text-[clamp(15px,4.4vw,19px)] text-[#7A5D33] [font-family:var(--inv-script,var(--app-font-display))]">{recipient}</span>
      </span>

      {/* Le rabat. */}
      <span aria-hidden className="mk-flap absolute inset-x-0 top-0 z-30 block aspect-[3/1.28] origin-top [transform-style:preserve-3d]">
        <span className="absolute inset-0 [backface-visibility:hidden] [filter:drop-shadow(0_1px_0_#C9B797)_drop-shadow(0_10px_12px_rgba(0,0,0,0.12))]">
          <span className="absolute inset-0 bg-[#DCCDB2] [clip-path:polygon(0_0,100%_0,50%_100%)]" />
          <span className="absolute inset-0 opacity-60 [background:linear-gradient(to_bottom,rgba(255,255,255,0.25),transparent_60%)] [clip-path:polygon(0_0,100%_0,50%_100%)]" />
        </span>
        <span className="absolute inset-0 [backface-visibility:hidden] [clip-path:polygon(0_0,100%_0,50%_100%)] [transform:rotateX(180deg)]">
          <span className="absolute inset-0 bg-[#B08D57] opacity-90" />
          <span className="absolute inset-0 [background:linear-gradient(to_top,rgba(0,0,0,0.18),transparent_55%)]" />
        </span>
      </span>

      {/* Le cachet. */}
      <span aria-hidden className="mk-seal absolute left-1/2 top-[64%] z-40 flex size-[clamp(52px,14vw,64px)] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-[15px] text-[#F6F0E4] shadow-[0_6px_10px_rgba(0,0,0,0.35)] [font-family:var(--app-font-display)]" style={{ background: "radial-gradient(circle at 34% 28%, #C9A66E 0%, #7A5D33 60%, #5A4324 100%)" }}>
        {monogram}
      </span>
    </div>
  );
}
