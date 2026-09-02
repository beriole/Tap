"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/lib/auth";

export type LoginState = { error: string | null };

/**
 * §5.1 - Connexion e-mail + mot de passe.
 *
 * On laisse signIn effectuer lui-meme la redirection : en cas de succes il leve
 * NEXT_REDIRECT, qu il faut donc relayer plutot qu avaler. Le seul cas qu on
 * intercepte est l echec d authentification, pour le rendre visible dans le
 * formulaire.
 *
 * La version precedente renvoyait vers /login?error=credentials sans rien
 * afficher : l utilisateur voyait la page se recharger, vide, et concluait que
 * le bouton ne marchait pas.
 */
export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Renseignez votre e-mail et votre mot de passe." };
  }

  try {
    await signIn("credentials", { email, password, redirectTo: "/dashboard" });
    return { error: null };
  } catch (error) {
    if (error instanceof AuthError) {
      // Message unique quelle que soit la cause : ne pas indiquer si l e-mail
      // existe, ni si le compte est suspendu (§12).
      return { error: "E-mail ou mot de passe incorrect." };
    }
    // NEXT_REDIRECT et le reste doivent continuer leur chemin.
    throw error;
  }
}

export async function logout() {
  await signOut({ redirectTo: "/login" });
}
