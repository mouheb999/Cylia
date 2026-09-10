import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import logo from "@/images/logo.png";
import FormulaireConnexion from "@/components/admin/FormulaireConnexion";
import { adminConnecte } from "@/lib/supabase/serveur";
import { supabaseConfigure } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Administration — CYLIA",
  robots: { index: false, follow: false },
};

export default async function PageConnexion() {
  if (supabaseConfigure && (await adminConnecte())) redirect("/admin");

  return (
    <main className="flex flex-1 flex-col justify-center px-6 py-12">
      <div className="mx-auto w-full max-w-sm">
        <Image src={logo} alt="CYLIA Maison de Beauté" className="mx-auto h-20 w-20" />

        <h1 className="mt-6 text-center font-serif text-2xl font-light text-cream">
          Administration
        </h1>
        <p className="mt-2 text-center text-sm font-light text-white/45">
          Réservé au salon.
        </p>

        {supabaseConfigure ? (
          <FormulaireConnexion />
        ) : (
          <p className="mt-8 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-5 text-center text-sm font-light leading-relaxed text-white/60">
            Le site n&apos;est pas encore relié à sa base de données.
            <br />
            Renseignez les variables d&apos;environnement Supabase.
          </p>
        )}

        <Link href="/" className="mt-8 block text-center text-sm font-light text-white/40">
          Retour au site
        </Link>
      </div>
    </main>
  );
}
