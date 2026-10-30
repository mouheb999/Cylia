import Link from "next/link";
import BoutonCoffret from "@/components/boutique/BoutonCoffret";
import VisuelCoffret from "@/components/boutique/VisuelCoffret";
import { Texte } from "@/components/edition/Modifiable";
import {
  cheminCoffret,
  prixBarreDuCoffret,
  produitsDuCoffret,
  stockDuCoffret,
  trierCoffrets,
  visuelsDuCoffret,
} from "@/lib/coffrets";
import { CONTENUS_DEFAUT } from "@/lib/contenu";
import { formatPrix, pourcentageRemise } from "@/lib/format";
import type { Coffret, Produit } from "@/lib/supabase/types";

/**
 * « Nos coffrets » — des produits de la boutique vendus ensemble.
 *
 * Une grille, pas une rangée qui défile : deux colonnes sur téléphone, trois
 * puis quatre sur grand écran. La cliente arrivée d'une publicité voit dès le
 * premier écran une photo, un prix et « Commander », sans deviner qu'il faut
 * glisser sur le côté pour trouver la suite.
 *
 * Du moins cher au plus cher (`trierCoffrets`) ; `epingle` met en tête le
 * coffret d'un lien publicitaire (`/boutique?coffret=<id>`).
 *
 * Sur la carte, à deux colonnes, rien que l'essentiel : la photo, le nom, le
 * prix, les boutons. Le détail du contenu attend la fiche, à un geste — ou
 * s'affiche sur grand écran, où la place ne manque pas.
 *
 * `limite` : l'accueil n'en montre que quelques-uns et renvoie à la boutique.
 * Sans aucun coffret, la section n'existe pas : une vitrine vide se lirait
 * comme une panne.
 */
export default function Coffrets({
  coffrets,
  produits,
  devise,
  epingle,
  limite,
  compact = false,
}: {
  coffrets: Coffret[];
  produits: Produit[];
  devise: string;
  epingle?: string | null;
  limite?: number;
  /** En-tête resserré : sur `/boutique`, la page a déjà son titre au-dessus. */
  compact?: boolean;
}) {
  if (coffrets.length === 0) return null;
  const tries = trierCoffrets(coffrets, produits, epingle);
  const affiches = limite ? tries.slice(0, limite) : tries;

  return (
    <section
      id="coffrets"
      className={`scroll-mt-24 bg-cream px-4 pb-10 ${compact ? "pt-3" : "pt-4"}`}
    >
      <div className={`text-center ${compact ? "mb-3" : "mb-5"}`}>
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
          className={`font-serif font-light text-ink ${compact ? "mt-1 text-xl" : "mt-2 text-2xl"}`}
        />
        <Texte
          cle="coffrets.texte"
          titre="Texte des coffrets"
          type="multiligne"
          defaut={CONTENUS_DEFAUT["coffrets.texte"]}
          balise="p"
          className={`mx-auto mt-2 max-w-[24rem] whitespace-pre-line text-[0.8rem] font-light leading-relaxed text-muted ${
            compact ? "hidden sm:block" : ""
          }`}
        />
        <div className={`gold-rule mx-auto h-px w-16 ${compact ? "mt-2" : "mt-3"}`} aria-hidden="true" />
      </div>

      <ul className="mx-auto grid max-w-6xl grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4">
        {affiches.map((coffret, index) => {
          const contenu = produitsDuCoffret(coffret, produits);
          const prixBarre = prixBarreDuCoffret(coffret, produits);
          const remise = pourcentageRemise(coffret.prix, prixBarre);
          const epuise = stockDuCoffret(coffret, produits) <= 0;

          return (
            <li
              key={coffret.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-sand bg-white"
            >
              <Link
                href={cheminCoffret(coffret)}
                aria-label={`Voir le coffret ${coffret.nom}`}
                className="relative block aspect-square overflow-hidden"
              >
                <VisuelCoffret
                  nom={coffret.nom}
                  photos={visuelsDuCoffret(coffret, produits)}
                  // La carte fait la moitié de l'écran sur téléphone (≈ 400 px
                  // utiles sur un écran 2x), un tiers puis un quart au-delà —
                  // dans la limite de `max-w-6xl`.
                  sizes="(min-width: 1152px) 288px, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                  preload={index < 2}
                />
                {remise !== null && (
                  <span className="absolute left-2 top-2 rounded-full bg-noir/80 px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.18em] text-gold">
                    −{remise} %
                  </span>
                )}
                {epuise && (
                  <span className="absolute inset-0 flex items-center justify-center bg-noir/65 text-xs uppercase tracking-[0.2em] text-cream">
                    Épuisé
                  </span>
                )}
              </Link>

              <div className="flex flex-1 flex-col p-2.5 sm:p-3.5">
                <h3 className="font-serif text-base leading-tight text-ink sm:text-lg">
                  <Link href={cheminCoffret(coffret)}>{coffret.nom}</Link>
                </h3>
                {contenu.length > 0 && (
                  <p className="mt-0.5 text-[0.65rem] font-light text-muted sm:hidden">
                    {contenu.length} produits
                  </p>
                )}
                <Link href={cheminCoffret(coffret)} tabIndex={-1} className="hidden sm:block">
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

                <div className="mt-auto pt-2 sm:pt-3">
                  <p className="flex flex-wrap items-baseline gap-x-1.5">
                    <span className="font-serif text-lg font-semibold leading-none text-gold-deep lining-nums sm:text-xl">
                      {formatPrix(coffret.prix, devise)}
                    </span>
                    {prixBarre !== null && (
                      <span className="text-[0.7rem] font-light text-muted line-through lining-nums">
                        {formatPrix(prixBarre, devise)}
                      </span>
                    )}
                  </p>
                  <div className="mt-2 sm:mt-3">
                    <BoutonCoffret
                      coffretId={coffret.id}
                      nom={coffret.nom}
                      prix={coffret.prix}
                      epuise={epuise}
                    />
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {affiches.length < tries.length && (
        <Link
          href="/boutique#coffrets"
          className="mx-auto mt-5 flex w-full max-w-[20rem] items-center justify-center rounded-full border border-gold-deep/40 py-3 font-serif text-base text-gold-deep"
        >
          Voir les {tries.length} coffrets
        </Link>
      )}
    </section>
  );
}
