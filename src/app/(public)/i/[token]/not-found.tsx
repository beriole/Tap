/**
 * Page neutre des invitations : lien inconnu, revoque, expire ou evenement non
 * publie donnent exactement ce texte. Rien ne distingue un jeton qui a existe
 * d un jeton invente.
 */
export default function InvitationUnavailable() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-[#F6F0E4] px-6 text-center text-[#2B231F]">
      <span aria-hidden className="flex items-center gap-3">
        <span className="h-px w-7 bg-[#B08D57]" />
        <span className="size-[5px] rotate-45 bg-[#B08D57]" />
        <span className="h-px w-7 bg-[#B08D57]" />
      </span>
      <h1 className="mt-6 text-[26px] font-medium tracking-[-0.01em]">Cette invitation n’est pas disponible</h1>
      <p className="mt-3 max-w-[320px] text-[15px] leading-relaxed text-[#675B52]">
        Le lien est peut-être incomplet ou n’est plus actif. Demandez à la personne qui vous l’a envoyé de vous le
        transmettre à nouveau.
      </p>
    </main>
  );
}
