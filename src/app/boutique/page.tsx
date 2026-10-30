import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";
import Coffrets from "@/components/Coffrets";
import Header from "@/components/Header";
import GrilleProduits from "@/components/boutique/GrilleProduits";
import { Texte } from "@/components/edition/Modifiable";
import { CONTENUS_DEFAUT, valeurContenu } from "@/lib/contenu";
import {
  chargerCoffrets,
  chargerContenus,
  chargerProduits,
  chargerReglages,
} from "@/lib/donnees";
import { formatPrix } from "@/lib/format";
import { infosSite } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Boutique — CYLIA Maison de Beauté",
  description:
    "Les cosmétiques et soins utilisés en cabine chez CYLIA Maison de Beauté, livrés partout en Tunisie.",
};

/**
 * `?coffret=<id>` : le lien d'une publicité pour un coffret précis. Ce coffret
 * passe en tête de la grille, les autres gardent leur ordre de prix.
 */
export default async function PageBoutique({ searchParams }: PageProps<"/boutique">) {
  const [produits, coffrets, reglages, contenus, recherche] = await Promise.all([
    chargerProduits(),
    chargerCoffrets(),
    chargerReglages(),
    chargerContenus(),
    searchParams,
  ]);

  const site = infosSite(contenus);
  const partenaireLien = valeurContenu(contenus, "boutique.partenaire_lien");
  const partenaireLibelle = valeurContenu(contenus, "boutique.partenaire_libelle");
  const epingle = typeof recherche.coffret === "string" ? recherche.coffret : null;

  return (
    <>
      <Header />
      <main className="flex-1 bg-cream">
        {/*
          Bandeau court sur téléphone — 180 px au plus : la cliente venue d'une
          publicité doit voir un coffret, son prix et « Commander » sans
          défiler. Le titre tient sur une ligne, et la promesse de livraison
          reste, c'est elle qui rassure avant d'acheter.
        */}
        <div className="max-h-[180px] overflow-hidden bg-noir px-5 pb-4 pt-4 text-center sm:max-h-none sm:pb-8 sm:pt-8">
          <Texte
            cle="boutique.surtitre"
            titre="Sur-titre de la boutique"
            defaut={CONTENUS_DEFAUT["boutique.surtitre"]}
            balise="p"
            className="text-[10px] uppercase tracking-[0.3em] text-gold"
          />
          <h1 className="mt-1.5 font-serif text-[1.65rem] font-light leading-tight text-cream sm:mt-3 sm:text-3xl">
            <Texte
              cle="boutique.titre"
              titre="Titre de la boutique"
              defaut={CONTENUS_DEFAUT["boutique.titre"]}
            />{" "}
            <Texte
              cle="boutique.titre_script"
              titre="Titre manuscrit de la boutique"
              defaut={CONTENUS_DEFAUT["boutique.titre_script"]}
              balise="span"
              className="font-script text-[2rem] text-gold sm:mt-0.5 sm:block sm:text-4xl"
            />
          </h1>
          <Texte
            cle="boutique.texte"
            titre="Phrase de la boutique"
            type="multiligne"
            defaut={CONTENUS_DEFAUT["boutique.texte"]}
            balise="p"
            className="mx-auto mt-1.5 line-clamp-2 max-w-[24rem] whitespace-pre-line text-[0.75rem] font-light leading-snug text-white/70 sm:mt-4 sm:line-clamp-none sm:text-[0.8rem] sm:leading-relaxed sm:text-white/55"
          />
        </div>

        {reglages.boutique_active && coffrets.length > 0 && (
          <div>
            <Coffrets
              coffrets={coffrets}
              produits={produits}
              devise={reglages.devise}
              epingle={epingle}
              compact
            />
          </div>
        )}

        <div className="px-4 py-6">
          {!reglages.boutique_active ? (
            <p className="rounded-2xl border border-sand bg-white px-5 py-10 text-center text-sm font-light leading-relaxed text-muted">
              La boutique est momentanément fermée. Les produits restent
              disponibles au salon.
            </p>
          ) : (
            <>
              <GrilleProduits produits={produits} devise={reglages.devise} />

              <p className="mt-6 rounded-2xl border border-sand bg-white px-4 py-4 text-center text-xs font-light leading-relaxed text-muted">
                Livraison{" "}
                <span className="font-medium text-gold-deep lining-nums">
                  {formatPrix(reglages.frais_livraison, reglages.devise)}
                </span>{" "}
                partout en Tunisie
                {reglages.livraison_gratuite_des != null && (
                  <>
                    {" "}
                    — offerte dès{" "}
                    <span className="font-medium text-gold-deep lining-nums">
                      {formatPrix(reglages.livraison_gratuite_des, reglages.devise)}
                    </span>
                  </>
                )}
                .
                <br />
                Paiement à la livraison.
              </p>

              <Link
                href="/boutique/panier"
                className="mx-auto mt-4 flex w-full max-w-[20rem] items-center justify-center rounded-full border border-gold-deep/40 py-3 font-serif text-base text-gold-deep"
              >
                Voir mon panier
              </Link>

              {partenaireLien && (
                <p className="mt-6 text-center text-xs font-light text-muted">
                  <a
                    href={partenaireLien}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline decoration-gold-deep/40 underline-offset-4"
                  >
                    {partenaireLibelle}
                  </a>
                </p>
              )}
            </>
          )}
        </div>
      </main>
      <Footer site={site} />
    </>
  );
}
