/**
 * Squelette de page.
 *
 * Affiche par les fichiers loading.tsx pendant que la route suivante se
 * prepare. Il reprend la silhouette reelle de la page - en-tete, tuiles,
 * surfaces - plutot qu un rond qui tourne : l ecran ne saute pas au moment ou
 * le contenu arrive.
 */
export function PageSkeleton({
  tiles = 4,
  blocks = 2,
}: {
  tiles?: number;
  blocks?: number;
}) {
  return (
    <div aria-busy="true" aria-live="polite" className="animate-pulse">
      <span className="sr-only">Chargement de la page</span>

      <div className="mb-7">
        <Bar className="h-2.5 w-24" />
        <Bar className="mt-3 h-7 w-56" />
        <Bar className="mt-3 h-3 w-80 max-w-full" />
      </div>

      {tiles > 0 && (
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: tiles }).map((_, i) => (
            <div
              key={i}
              className="h-[5.5rem] rounded-2xl border border-[var(--border)] bg-[var(--background)]"
            />
          ))}
        </div>
      )}

      <div className="space-y-4">
        {Array.from({ length: blocks }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6"
          >
            <Bar className="h-3 w-32" />
            <Bar className="mt-4 h-3 w-full" />
            <Bar className="mt-2.5 h-3 w-4/5" />
          </div>
        ))}
      </div>
    </div>
  );
}

function Bar({ className }: { className?: string }) {
  return <div className={`rounded-full bg-[var(--border)] ${className}`} />;
}
