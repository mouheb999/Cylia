import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import GrandeCarte from "@/components/packs/GrandeCarte";
import GrillePacks from "@/components/packs/GrillePacks";
import { Texte } from "@/components/edition/Modifiable";
import { CONTENUS_DEFAUT } from "@/lib/contenu";
import {
  chargerCategoriesPacks,
  chargerContenus,
  chargerPacks,
  chargerReglages,
} from "@/lib/donnees";
import {
  cheminCategoriePack,
  imageCategoriePack,
  libelleNombrePacks,
  packsDeCategorie,
  packsHorsCategorie,
} from "@/lib/packs";
import { infosSite } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Nos packs — CYLIA Maison de Beauté",
  description:
    "Les formules du salon : hammam, head spa, mariée — ce que chacune comprend, sa durée et son tarif, chez CYLIA Maison de Beauté à Sousse.",
};

/**
 * Les packs, par catégorie.
 *
 * Une grande carte par catégorie — hammam, mariée, les autres —, chacune
 * ouvre ses formules. Les packs qu'aucune catégorie ne recueille suivent en
 * grille, en dessous. Tant que le salon n'a créé aucune catégorie, la page
 * reste la grille complète d'avant.
 */
export default async function PagePacks() {
  const [packs, categoriesToutes, reglages, contenus] = await Promise.all([
    chargerPacks(),
    chargerCategoriesPacks(),
    chargerReglages(),
    chargerContenus(),
  ]);

  // Une catégorie vide ne mène nulle part : elle attend son premier pack.
  const categories = categoriesToutes.filter((c) => packsDeCategorie(c, packs).length > 0);
  const horsCategorie = packsHorsCategorie(categories, packs);

  return (
    <>
      <Header />
      <main className="flex-1 bg-cream">
        <div className="bg-noir px-5 pb-8 pt-8 text-center">
          <Texte
            cle="packs.surtitre"
            titre="Sur-titre des packs"
            defaut={CONTENUS_DEFAUT["packs.surtitre"]}
            balise="p"
            className="text-[10px] uppercase tracking-[0.3em] text-gold"
          />
          <h1 className="mt-3 font-serif text-3xl font-light text-cream">
            <Texte
              cle="packs.titre"
              titre="Titre des packs"
              defaut={CONTENUS_DEFAUT["packs.titre"]}
            />
          </h1>
          <Texte
            cle="packs.texte"
            titre="Texte des packs"
            type="multiligne"
            defaut={CONTENUS_DEFAUT["packs.texte"]}
            balise="p"
            className="mx-auto mt-4 max-w-[24rem] whitespace-pre-line text-[0.8rem] font-light leading-relaxed text-white/55"
          />
          <div className="gold-rule mx-auto mt-4 h-px w-16" aria-hidden="true" />
        </div>

        <div className="px-4 py-6">
          {packs.length === 0 ? (
            <p className="rounded-2xl border border-sand bg-white px-5 py-10 text-center text-sm font-light leading-relaxed text-muted">
              Les formules du salon arrivent bientôt. En attendant, toutes les
              prestations se réservent une à une.
            </p>
          ) : (
            <>
              {categories.length > 0 && (
                <ul className="mx-auto max-w-[40rem] space-y-4">
                  {categories.map((categorie, index) => (
                    <li key={categorie.id}>
                      <GrandeCarte
                        href={cheminCategoriePack(categorie)}
                        titre={categorie.nom}
                        alt={categorie.nom}
                        texte={categorie.description || undefined}
                        image={imageCategoriePack(categorie, packs)}
                        mention={libelleNombrePacks(packsDeCategorie(categorie, packs).length)}
                        priority={index === 0}
                      />
                    </li>
                  ))}
                </ul>
              )}

              {horsCategorie.length > 0 && (
                <div className={categories.length > 0 ? "mt-8" : ""}>
                  {categories.length > 0 && (
                    <>
                      <h2 className="text-center font-serif text-xl font-light text-ink">
                        Nos autres formules
                      </h2>
                      <div className="gold-rule mx-auto mt-3 mb-5 h-px w-16" aria-hidden="true" />
                    </>
                  )}
                  <GrillePacks packs={horsCategorie} devise={reglages.devise} />
                </div>
              )}
            </>
          )}

          <Link
            href="/reserver"
            className="mx-auto mt-6 flex w-full max-w-[20rem] items-center justify-center rounded-full border border-gold-deep/40 py-3 font-serif text-base text-gold-deep"
          >
            Prendre rendez-vous
          </Link>
        </div>
      </main>
      <Footer site={infosSite(contenus)} />
    </>
  );
}
