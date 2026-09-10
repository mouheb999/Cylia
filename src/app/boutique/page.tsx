import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import GrilleProduits from "@/components/boutique/GrilleProduits";
import { Texte } from "@/components/edition/Modifiable";
import { CONTENUS_DEFAUT } from "@/lib/contenu";
import { chargerContenus, chargerProduits, chargerReglages } from "@/lib/donnees";
import { formatPrix } from "@/lib/format";
import { infosSite } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Boutique — CYLIA Maison de Beauté",
  description:
    "Les cosmétiques et soins utilisés en cabine chez CYLIA Maison de Beauté, livrés partout en Tunisie.",
};

export default async function PageBoutique() {
  const [produits, reglages, contenus] = await Promise.all([
    chargerProduits(),
    chargerReglages(),
    chargerContenus(),
  ]);

  const site = infosSite(contenus);

  return (
    <>
      <Header />
      <main className="flex-1 bg-cream">
        <div className="bg-noir px-5 pb-8 pt-8 text-center">
          <Texte
            cle="boutique.surtitre"
            titre="Sur-titre de la boutique"
            defaut={CONTENUS_DEFAUT["boutique.surtitre"]}
            balise="p"
            className="text-[10px] uppercase tracking-[0.3em] text-gold"
          />
          <h1 className="mt-3 font-serif text-3xl font-light text-cream">
            <Texte
              cle="boutique.titre"
              titre="Titre de la boutique"
              defaut={CONTENUS_DEFAUT["boutique.titre"]}
            />
            <Texte
              cle="boutique.titre_script"
              titre="Titre manuscrit de la boutique"
              defaut={CONTENUS_DEFAUT["boutique.titre_script"]}
              balise="span"
              className="mt-0.5 block font-script text-4xl text-gold"
            />
          </h1>
          <Texte
            cle="boutique.texte"
            titre="Phrase de la boutique"
            type="multiligne"
            defaut={CONTENUS_DEFAUT["boutique.texte"]}
            balise="p"
            className="mx-auto mt-4 max-w-[24rem] whitespace-pre-line text-[0.8rem] font-light leading-relaxed text-white/55"
          />
        </div>

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
                Livraison {formatPrix(reglages.frais_livraison, reglages.devise)} partout en
                Tunisie
                {reglages.livraison_gratuite_des != null && (
                  <>
                    {" "}
                    — offerte dès{" "}
                    {formatPrix(reglages.livraison_gratuite_des, reglages.devise)}
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
            </>
          )}
        </div>
      </main>
      <Footer site={site} />
    </>
  );
}
