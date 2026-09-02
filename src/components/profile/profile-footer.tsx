import { siteConfig } from "@/config/site";

export function ProfileFooter({ compact = false }: { compact?: boolean }) {
  return (
    <footer className={`pb-10 pt-8 text-center text-xs text-[var(--muted)] ${compact ? "pt-6" : ""}`}>
      <p>
        Propulse par <span className="font-medium">{siteConfig.name}</span>
      </p>
    </footer>
  );
}
