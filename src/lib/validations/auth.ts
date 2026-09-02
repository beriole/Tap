import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("E-mail invalide."),
  password: z.string().min(8, "8 caracteres minimum."),
});

export const registerSchema = loginSchema
  .extend({
    name: z.string().min(2).max(80),
    password: z
      .string()
      .min(10, "10 caracteres minimum.")
      .regex(/[a-z]/, "Une minuscule requise.")
      .regex(/[A-Z]/, "Une majuscule requise.")
      .regex(/[0-9]/, "Un chiffre requis."),
    confirmPassword: z.string(),
    /** §5.1 - inscription controlee ou invitation apres achat de la carte. */
    inviteToken: z.string().min(10).optional(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Les mots de passe ne correspondent pas.",
  });

export const forgotPasswordSchema = z.object({ email: z.string().email() });

export const resetPasswordSchema = z
  .object({
    token: z.string().min(10),
    password: z.string().min(10),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Les mots de passe ne correspondent pas.",
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
