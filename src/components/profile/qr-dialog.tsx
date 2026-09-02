"use client";

import Image from "next/image";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

/**
 * §5.4 / §11 - Le QR affiche est genere par le serveur depuis le token de la
 * carte : il pointe donc exactement vers la meme URL canonique que la NFC.
 */
export function QrDialog({
  open,
  onOpenChange,
  token,
  url,
  name,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: string;
  url: string;
  name: string;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(22rem,90vw)] -translate-x-1/2 -translate-y-1/2 rounded-[var(--radius-card)] bg-[var(--background)] p-6 shadow-[var(--shadow-lift)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-base font-medium">{name}</Dialog.Title>
              <Dialog.Description className="mt-1 text-xs text-[var(--muted)]">
                Scannez ce code pour ouvrir le profil.
              </Dialog.Description>
            </div>
            <Dialog.Close aria-label="Fermer" className="text-[var(--muted)]">
              <X className="size-5" />
            </Dialog.Close>
          </div>

          <div className="mt-5 overflow-hidden rounded-xl bg-white p-3">
            <Image
              src={`/api/qr/${token}`}
              alt={`QR Code du profil de ${name}`}
              width={512}
              height={512}
              unoptimized
              className="h-auto w-full"
            />
          </div>

          <p className="mt-4 break-all text-center text-xs text-[var(--muted)]">{url}</p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
