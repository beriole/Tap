import QRCode from "qrcode";
import { cardUrl } from "@/config/site";

/**
 * §11 - "Le QR Code et la NFC doivent pointer vers la meme URL canonique."
 * Le QR est donc genere depuis le token de carte, jamais depuis une autre source.
 */
export async function cardQrSvg(token: string, accent = "#000000"): Promise<string> {
  return QRCode.toString(cardUrl(token), {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 1,
    width: 512,
    color: { dark: accent, light: "#FFFFFF" },
  });
}

export async function cardQrDataUrl(token: string, accent = "#000000"): Promise<string> {
  return QRCode.toDataURL(cardUrl(token), {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 512,
    color: { dark: accent, light: "#FFFFFF" },
  });
}
