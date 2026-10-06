import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import GrillePacks from "@/components/packs/GrillePacks";
import {
  chargerCategoriePack,
  chargerContenus,
  chargerPacks,
  chargerReglages,
} from "@/lib/donnees";
import { packsDeCategorie } from "@/lib/packs";
import { infosSite } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/packs/categorie/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const categorie = await chargerCategoriePack(slug);
  if (!categorie) return { title: "Nos packs — CYLIA Maison de Beauté" };
  return {
    title: `${categorie.nom} — CYLIA Maison de Beauté`,
    description:
      categorie.description || `${categorie.nom}, les formules de CYLIA Maison de Beauté, à Sousse.`,
  };
}

/** Une catégorie de packs : ses formules, en grille, chacune vers sa fiche. */
export default async function PageCategoriePack({
  params,
}: PageProps<"/packs/categorie/[slug]">) {
  const { slug } = await params;
  const [categorie, packs, reglages, contenus] = await Promise.all([
    chargerCategoriePack(slug),
    chargerPacks(),
    chargerReglages(),
    chargerContenus(),
  ]);

  if (!categorie) notFound();

  const siens = packsDeCategorie(categorie, packs);

  return (
    <>
      <Header />
      <main className="flex-1 bg-cream">
        <div className="bg-noir px-5 pb-8 pt-8 text-center">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gold">Nos packs</p>
          <h1 className="mt-3 font-serif text-3xl font-light text-cream">{categorie.nom}</h1>
          {categorie.description && (
            <p className="mx-auto mt-4 max-w-[24rem] whitespace-pre-line text-[0.8rem] font-light leading-relaxed text-white/55">
              {categorie.description}
            </p>
          )}
          <div className="gold-rule mx-auto mt-4 h-px w-16" aria-hidden="true" />
        </div>

        <div className="px-4 py-6">
          {siens.length === 0 ? (
            <p className="rounded-2xl border border-sand bg-white px-5 py-10 text-center text-sm font-light leading-relaxed text-muted">
              Les formules de cette catégorie arrivent bientôt.
            </p>
          ) : (
            <GrillePacks packs={siens} devise={reglages.devise} />
          )}

          <Link href="/packs" className="mt-6 block text-center text-sm font-light text-muted">
            ← Toutes les catégories
          </Link>
        </div>
      </main>
      <Footer site={infosSite(contenus)} />
    </>
  );
}
