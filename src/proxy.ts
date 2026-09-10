import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_CLE, SUPABASE_URL, supabaseConfigure } from "@/lib/supabase/config";

/**
 * Rafraîchit la session Supabase à chaque requête et barre l'entrée du panneau.
 *
 * Le contrôle fait ici est *optimiste* : il regarde s'il existe une session, pas
 * si le compte est administrateur. La vraie autorisation est vérifiée dans
 * `src/app/admin/layout.tsx` et, en dernier ressort, par RLS côté base — un
 * proxy ne doit pas être le seul rempart.
 */
export async function proxy(request: NextRequest) {
  const reponse = NextResponse.next({ request });
  if (!supabaseConfigure) return reponse;

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_CLE, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesAPoser) {
        cookiesAPoser.forEach(({ name, value }) => request.cookies.set(name, value));
        cookiesAPoser.forEach(({ name, value, options }) =>
          reponse.cookies.set(name, value, options),
        );
      },
    },
  });

  // Ne pas retirer : c'est cet appel qui renouvelle le jeton avant expiration.
  // Sans lui, les administratrices se retrouvent déconnectées au hasard.
  const { data } = await supabase.auth.getClaims();

  const chemin = request.nextUrl.pathname;
  const versConnexion = chemin.startsWith("/admin/connexion");

  if (chemin.startsWith("/admin") && !versConnexion && !data?.claims) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/connexion";
    url.searchParams.set("suite", chemin);
    return NextResponse.redirect(url);
  }

  return reponse;
}

export const config = {
  matcher: [
    /*
     * Toutes les pages sauf les fichiers statiques et les images : inutile de
     * réveiller Supabase pour un logo.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)",
  ],
};
