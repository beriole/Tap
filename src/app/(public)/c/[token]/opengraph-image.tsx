import { ImageResponse } from "next/og";
import { resolveCard } from "@/server/card-resolution";

export const alt = "Profil professionnel";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** §13 - image Open Graph generee par profil, sans stockage supplementaire. */
export default async function OgImage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const result = await resolveCard(token);

  const name = result.ok ? result.profile.identity.displayName : "Carte indisponible";
  const subtitle = result.ok
    ? [result.profile.identity.title, result.profile.identity.company].filter(Boolean).join(" - ")
    : "";
  const accent = result.ok ? result.profile.theme.accentColor : "#111827";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#0b0b0c",
          color: "#ffffff",
        }}
      >
        <div style={{ width: 88, height: 6, background: accent, marginBottom: 40 }} />
        <div style={{ fontSize: 76, fontWeight: 600 }}>{name}</div>
        {subtitle ? (
          <div style={{ fontSize: 34, marginTop: 16, opacity: 0.7 }}>{subtitle}</div>
        ) : null}
      </div>
    ),
    size,
  );
}
