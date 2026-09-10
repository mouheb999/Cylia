import Link from "next/link";
import { redirect } from "next/navigation";
import BoutonDeconnexion from "@/components/admin/BoutonDeconnexion";
import NavAdmin from "@/components/admin/NavAdmin";
import { adminConnecte } from "@/lib/supabase/serveur";
import { supabaseConfigure } from "@/lib/supabase/config";

/**
 * Seconde barrière du panneau.
 *
 * `proxy.ts` a déjà écarté les visiteurs sans session, mais il ne sait pas si
 * le compte est administrateur. C'est ici qu'on le vérifie — et une troisième
 * fois côté base, où RLS refuse toute écriture à un compte absent de
 * `administrateurs`.
 */
export default async function LayoutPanneau({ children }: LayoutProps<"/admin">) {
  if (!supabaseConfigure) redirect("/admin/connexion");
  const admin = await adminConnecte();
  if (!admin) redirect("/admin/connexion");

  return (
    <div className="flex min-h-full flex-1 flex-col bg-noir">
      <header className="flex items-center justify-between gap-3 border-b border-white/8 px-4 py-3">
        <div className="min-w-0">
          <p className="font-serif text-lg font-light text-cream">CYLIA</p>
          <p className="truncate text-[0.7rem] font-light text-white/40">{admin.email}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/"
            className="rounded-full border border-gold/30 px-3.5 py-1.5 text-xs text-gold"
          >
            Voir le site
          </Link>
          <BoutonDeconnexion />
        </div>
      </header>

      <NavAdmin />

      <main className="flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
