import Link from "next/link";
import BoutonCoffret from "@/components/boutique/BoutonCoffret";
import VisuelCoffret from "@/components/boutique/VisuelCoffret";
import { Texte } from "@/components/edition/Modifiable";
import {
  cheminCoffret,
  produitsDuCoffret,
  stockDuCoffret,
  valeurSepareeDuCoffret,
  visuelsDuCoffret,
} from "@/lib/coffrets";
import { CONTENUS_DEFAUT } from "@/lib/contenu";
import { formatPrix } from "@/lib/format";
import type { Coffret, Produit } from "@/lib/supabase/types";

/**
 * « Nos coffrets » — des produits de la boutique vendus ensemble.
 *
 * Posée juste au-dessus de l'encart boutique : c'est la même vitrine, livrée
 * de la même façon, et le coffret s'ajoute au même panier que les flacons.
 *
 * Même rangée que l'encart — défilement natif, une carte qui dépasse du bord
 * pour dire qu'il y a la suite. Un coffret seul prend toute la largeur.
 *
 * Sans aucun coffret, la section n'existe pas : une vitrine vide se lirait
 * comme une panne.
 */
export default function Coffrets({
  coffrets,
  produits,
  devise,
}: {
  coffrets: Coffret[];
  produits: Produit[];
  devise: string;
}) {
  if (coffrets.length === 0) return null;
  const seul = coffrets.length === 1;

  return (
    <section id="coffrets" className="scroll-mt-24 bg-cream px-4 pb-10 pt-4">
      <div className="mb-5 text-center">
        <Texte
          cle="coffrets.surtitre"
          titre="Sur-titre des coffrets"
          defaut={CONTENUS_DEFAUT["coffrets.surtitre"]}
          balise="p"
          className="text-[10px] uppercase tracking-[0.3em] text-gold-deep"
        />
        <Texte
          cle="coffrets.titre"
          titre="Titre des coffrets"
          defaut={CONTENUS_DEFAUT["coffrets.titre"]}
          balise="h2"
          className="mt-2 font-serif text-2xl font-light text-ink"
        />
        <Texte
          cle="coffrets.texte"
          titre="Texte des coffrets"
          type="multiligne"
          defaut={CONTENUS_DEFAUT["coffrets.texte"]}
          balise="p"
          className="mx-auto mt-2 max-w-[24rem] whitespace-pre-line text-[0.8rem] font-light leading-relaxed text-muted"
        />
        <div className="gold-rule mx-auto mt-3 h-px w-16" aria-hidden="true" />
      </div>

      <ul
        tabIndex={0}
        role="region"
        aria-label="Nos coffrets, à faire défiler sur le côté"
        className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-1
          [scrollbar-width:none] focus-visible:outline-none [&::-webkit-scrollbar]:hidden"
      >
        {coffrets.map((coffret) => {
          const contenu = produitsDuCoffret(coffret, produits);
          const valeur = valeurSepareeDuCoffret(coffret, produits);
          const epuise = stockDuCoffret(coffret, produits) <= 0;

          return (
            <li
              key={coffret.id}
              className={`flex shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-sand bg-white ${
                seul ? "w-full" : "w-[16rem]"
              }`}
            >
              <Link
                href={cheminCoffret(coffret)}
                aria-label={`Voir le coffret ${coffret.nom}`}
                className="relative block aspect-[4/3] overflow-hidden"
              >
                <VisuelCoffret
                  nom={coffret.nom}
                  photos={visuelsDuCoffret(coffret, produits)}
                  sizes={seul ? "100vw" : "256px"}
                />
                {valeur !== null && (
                  <span className="absolute left-2.5 top-2.5 rounded-full bg-noir/80 px-2.5 py-1 text-[0.6rem] uppercase tracking-[0.18em] text-gold">
                    −{Math.round((1 - coffret.prix / valeur) * 100)} %
                  </span>
                )}
                {epuise && (
                  <span className="absolute inset-0 flex items-center justify-center bg-noir/65 text-xs uppercase tracking-[0.2em] text-cream">
                    Épuisé
                  </span>
                )}
              </Link>

              <div className="flex flex-1 flex-col p-3.5">
                <h3 className="font-serif text-lg leading-snug text-ink">
                  <Link href={cheminCoffret(coffret)}>{coffret.nom}</Link>
                </h3>
                <Link href={cheminCoffret(coffret)} tabIndex={-1} className="block">
                  {coffret.description && (
                    <p className="mt-1 line-clamp-3 text-[0.75rem] font-light leading-relaxed text-muted">
                      {coffret.description}
                    </p>
                  )}

                  {contenu.length > 0 && (
                    <ul className="mt-2.5 space-y-1 border-t border-sand/70 pt-2.5">
                      {contenu.map((produit) => (
                        <li
                          key={produit.id}
                          className="flex gap-2 text-[0.72rem] font-light leading-snug text-ink"
                        >
                          <span className="mt-[0.4rem] h-1 w-1 shrink-0 rounded-full bg-gold-deep" aria-hidden="true" />
                          {produit.nom}
                        </li>
                      ))}
                    </ul>
                  )}
                </Link>

                <div className="mt-auto pt-3">
                  <p className="flex items-baseline gap-2">
                    <span className="font-serif text-xl font-semibold leading-none text-gold-deep lining-nums">
                      {formatPrix(coffret.prix, devise)}
                    </span>
                    {valeur !== null && (
                      <span className="text-xs font-light text-muted line-through lining-nums">
                        {formatPrix(valeur, devise)}
                      </span>
                    )}
                  </p>
                  <div className="mt-3">
                    <BoutonCoffret coffretId={coffret.id} nom={coffret.nom} epuise={epuise} />
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
