"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { clientServeur } from "@/lib/supabase/serveur";

export type EtatConnexion = { message: string } | null;

/**
 * Connexion de l'administratrice.
 *
 * Le mot de passe ne transite que dans cette action serveur : la page de
 * connexion n'appelle jamais Supabase depuis le navigateur. Un compte valide
 * mais absent de `administrateurs` est déconnecté aussitôt — être inscrit ne
 * suffit pas à administrer.
 */
export async function connexion(
  _precedent: EtatConnexion,
  formData: FormData,
): Promise<EtatConnexion> {
  const email = String(formData.get("email") ?? "").trim();
  const motDePasse = String(formData.get("motDePasse") ?? "");

  if (!email || !motDePasse) {
    return { message: "Renseignez votre e-mail et votre mot de passe." };
  }

  const supabase = await clientServeur();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: motDePasse,
  });

  if (error || !data.user) {
    return { message: "E-mail ou mot de passe incorrect." };
  }

  const { data: admin } = await supabase
    .from("administrateurs")
    .select("user_id")
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (!admin) {
    await supabase.auth.signOut();
    return { message: "Ce compte n'a pas accès à l'administration." };
  }

  revalidatePath("/", "layout");
  redirect("/admin");
}

export async function deconnexion(): Promise<void> {
  const supabase = await clientServeur();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/admin/connexion");
}
