"use client";

import { useState, useTransition } from "react";
import type { Profile } from "@prisma/client";
import { VISIBILITY_FIELDS } from "@/lib/validations/profile";
import { ImageUploader } from "./image-uploader";

type Props = { profile: Profile | null };

/**
 * §5.2 - Editeur de profil regroupe par blocs : identite, contact, adresse,
 * presentation, visibilite. La validation serveur reste la source de verite
 * (lib/validations/profile.ts) ; ce formulaire ne fait que la refleter.
 */
export function ProfileEditor({ profile }: Props) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const visibility = (profile?.fieldVisibility ?? {}) as Record<string, boolean>;

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    const fieldVisibility = Object.fromEntries(
      VISIBILITY_FIELDS.map((key) => [key, form.get(`visibility.${key}`) === "on"]),
    );

    const payload = {
      ...Object.fromEntries(
        [...form.entries()]
          .filter(([key]) => !key.startsWith("visibility."))
          .map(([key, value]) => [key, value === "" ? "" : value]),
      ),
      fieldVisibility,
      isPublished: form.get("isPublished") === "on",
      seoIndexable: form.get("seoIndexable") === "on",
    };

    startTransition(async () => {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setMessage(response.ok ? "Profil enregistre." : "Enregistrement impossible.");
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-5">
      {/* Les medias partent immediatement vers /api/upload : ils ne dependent
          pas de l enregistrement du reste du formulaire. */}
      <Block title="Medias">
        <div className="col-span-full grid gap-5 sm:grid-cols-3">
          <ImageUploader kind="avatar" current={profile?.avatarUrl ?? null} />
          <ImageUploader kind="logo" current={profile?.logoUrl ?? null} />
          <ImageUploader kind="cover" current={profile?.coverUrl ?? null} />
        </div>
      </Block>

      <Block title="Identite">
        <Input name="displayName" label="Nom affiche" defaultValue={profile?.displayName} required />
        <Input name="firstName" label="Prenom" defaultValue={profile?.firstName} />
        <Input name="lastName" label="Nom" defaultValue={profile?.lastName} />
        <Input name="title" label="Poste" defaultValue={profile?.title} />
        <Input name="company" label="Entreprise" defaultValue={profile?.company} />
        <Input name="tagline" label="Slogan" defaultValue={profile?.tagline} />
        <Textarea name="bio" label="Biographie" defaultValue={profile?.bio} />
      </Block>

      <Block title="Contact">
        <Input name="phone" label="Telephone" defaultValue={profile?.phone} />
        <Input name="whatsapp" label="WhatsApp" defaultValue={profile?.whatsapp} />
        <Input name="emailPublic" label="E-mail public" type="email" defaultValue={profile?.emailPublic} />
        <Input name="website" label="Site principal" defaultValue={profile?.website} />
      </Block>

      <Block title="Adresse">
        <Input name="address" label="Adresse" defaultValue={profile?.address} />
        <Input name="city" label="Ville" defaultValue={profile?.city} />
        <Input name="country" label="Pays" defaultValue={profile?.country} />
        <Input name="lat" label="Latitude" defaultValue={profile?.lat ?? undefined} />
        <Input name="lng" label="Longitude" defaultValue={profile?.lng ?? undefined} />
        <Input name="mapUrl" label="URL cartographique" defaultValue={profile?.mapUrl} />
      </Block>

      <Block title="Presentation">
        <Textarea name="introText" label="Texte d introduction" defaultValue={profile?.introText} />
        <Input name="availability" label="Disponibilite" defaultValue={profile?.availability} />
        <Input name="ctaLabel" label="Libelle du CTA" defaultValue={profile?.ctaLabel} />
        <Input name="ctaUrl" label="Lien du CTA" defaultValue={profile?.ctaUrl} />
      </Block>

      {/* §5.2 - afficher/masquer chaque champ ou bloc individuellement. */}
      <Block title="Visibilite">
        <div className="col-span-full grid grid-cols-2 gap-2 sm:grid-cols-3">
          {VISIBILITY_FIELDS.map((key) => (
            <label key={key} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name={`visibility.${key}`}
                defaultChecked={visibility[key] !== false}
                className="size-4"
              />
              {key}
            </label>
          ))}
        </div>
      </Block>

      <Block title="Publication">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="isPublished"
            defaultChecked={profile?.isPublished ?? false}
            className="size-4"
          />
          Publier le profil
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="seoIndexable"
            defaultChecked={profile?.seoIndexable ?? true}
            className="size-4"
          />
          Autoriser l indexation par les moteurs
        </label>
      </Block>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="tap-target rounded-[var(--radius-button)] bg-[var(--foreground)] px-6 text-sm font-medium text-[var(--background)] disabled:opacity-60"
        >
          {pending ? "Enregistrement..." : "Enregistrer"}
        </button>
        {message && <p className="text-sm text-[var(--muted)]">{message}</p>}
      </div>
    </form>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="rounded-[var(--radius-card)] border border-[var(--border)] p-5">
      <legend className="px-2 text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
        {title}
      </legend>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

/** Prisma renvoie `null` pour un champ vide ; l input HTML veut `""`. */
function Input({
  label,
  defaultValue,
  ...props
}: { label: string; defaultValue?: string | number | null } & Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "defaultValue"
>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs text-[var(--muted)]">{label}</span>
      <input
        {...props}
        defaultValue={defaultValue ?? ""}
        className="w-full rounded-[var(--radius-button)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm"
      />
    </label>
  );
}

function Textarea({
  label,
  defaultValue,
  ...props
}: { label: string; defaultValue?: string | null } & Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  "defaultValue"
>) {
  return (
    <label className="col-span-full block">
      <span className="mb-1.5 block text-xs text-[var(--muted)]">{label}</span>
      <textarea
        {...props}
        rows={3}
        defaultValue={defaultValue ?? ""}
        className="w-full rounded-[var(--radius-button)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm"
      />
    </label>
  );
}
