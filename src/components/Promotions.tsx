import Image from "next/image";
import Link from "next/link";
import { Texte } from "@/components/edition/Modifiable";
import { CONTENUS_DEFAUT } from "@/lib/contenu";
import { depuisCleDate, formatPrix } from "@/lib/format";
import { remisePourcent, type PrestationEnPromo } from "@/lib/promotions";
import type { Groupe } from "@/lib/supabase/types";
import { IconArrow, IconBienEtre, IconCoiffure, IconEsthetique } from "./Icons";

/** Sans photo, la vignette montre l'icône de la catégorie — comme au tunnel. */
const ICONES: Record<string, typeof IconCoiffure> = {
  coiffure: IconCoiffure,
  esthetique: IconEsthetique,
  "bien-etre": IconBienEtre,
};

/** « jusqu'au 30 sept. » — la fin d'une offre se dit comme une date, pas comme un compte à rebours. */
function finLisible(date: string): string {
  return depuisCleDate(date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

/**
 * Les offres du moment.
 *
 * La section n'existe que s'il y a des offres : un bandeau « Promotions » vide
 * se lirait comme une panne, et l'encart « Prenez soin de vous » qui y mène
 * retrouve alors sa destination d'avant. Le salon n'a donc rien à allumer ni à
 * éteindre — il pose une remise sur une prestation, la section apparaît ; il
 * la retire, elle disparaît.
 *
 * Chaque carte mène à la réservation avec la prestation déjà retenue : une
 * offre vue est une offre qu'on peut prendre en un geste.
 */
export default function Promotions({
  offres,
  groupes,
  devise,
}: {
  offres: PrestationEnPromo[];
  groupes: Groupe[];
  devise: string;
}) {
  if (offres.length === 0) return null;

  const couvertures = new Map(groupes.map((g) => [g.id, g.image_url]));

  return (
    <section id="promotions" className="scroll-mt-24 bg-cream px-4 pb-10 pt-2">
      <div className="mb-5 text-center">
        <Texte
          cle="promos.surtitre"
          titre="Sur-titre des promotions"
          defaut={CONTENUS_DEFAUT["promos.surtitre"]}
          balise="p"
          className="text-[10px] uppercase tracking-[0.3em] text-gold-deep"
        />
        <Texte
          cle="promos.titre"
          titre="Titre des promotions"
          defaut={CONTENUS_DEFAUT["promos.titre"]}
          balise="h2"
          className="mt-2 font-serif text-2xl font-light text-ink"
        />
        <Texte
          cle="promos.texte"
          titre="Texte des promotions"
          type="multiligne"
          defaut={CONTENUS_DEFAUT["promos.texte"]}
          balise="p"
          className="mx-auto mt-2 max-w-[24rem] whitespace-pre-line text-[0.8rem] font-light leading-relaxed text-muted"
        />
        <div className="gold-rule mx-auto mt-3 h-px w-16" aria-hidden="true" />
      </div>

      <ul className="space-y-2.5">
        {offres.map((offre) => {
          const photo = offre.image_url ?? (offre.groupe_id ? couvertures.get(offre.groupe_id) : null);
          const remise = remisePourcent(offre);
          const Icone = ICONES[offre.categorie_id] ?? IconEsthetique;
          return (
            <li key={offre.id}>
              <Link
                href={`/reserver?categorie=${encodeURIComponent(offre.categorie_id)}&prestation=${encodeURIComponent(offre.id)}`}
                className="press flex items-center gap-3 rounded-2xl border border-sand bg-white p-2.5 shadow-[0_2px_12px_rgba(42,37,33,0.04)]"
              >
                <span className="relative block h-[4.5rem] w-[4.5rem] shrink-0 overflow-hidden rounded-xl bg-sand">
                  {photo ? (
                    <Image src={photo} alt={offre.nom} fill sizes="72px" className="object-cover" />
                  ) : (
                    <span className="flex h-full items-center justify-center" aria-hidden="true">
                      <Icone className="h-8 w-8 text-gold-deep/45" />
                    </span>
                  )}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="rounded-full bg-gold-deep/10 px-2 py-0.5 text-[0.62rem] font-medium uppercase tracking-[0.12em] text-gold-deep">
                      −{remise}%
                    </span>
                    {offre.promo_fin && (
                      <span className="text-[0.62rem] font-light text-muted">
                        jusqu&apos;au {finLisible(offre.promo_fin)}
                      </span>
                    )}
                  </span>

                  <span className="mt-1 block truncate font-serif text-[1.05rem] text-ink">
                    {offre.nom}
                  </span>

                  <span className="mt-0.5 block text-[0.72rem] font-light text-muted">
                    {offre.promo_libelle || offre.description}
                  </span>

                  <span className="mt-1 flex items-baseline gap-2 lining-nums">
                    <span className="font-serif text-[1.45rem] font-semibold leading-none text-gold-deep">
                      {formatPrix(offre.prix_promo, devise)}
                    </span>
                    <span className="text-[0.75rem] font-light text-muted line-through">
                      {formatPrix(offre.prix, devise)}
                    </span>
                  </span>
                </span>

                <IconArrow className="h-4 w-4 shrink-0 text-gold-deep" />
              </Link>
            </li>
          );
        })}
      </ul>

      <Link
        href="/reserver"
        className="mx-auto mt-5 flex w-full max-w-[20rem] items-center justify-center gap-2 rounded-full border border-gold-deep/40 py-3 font-serif text-base text-gold-deep"
      >
        <Texte
          cle="promos.bouton"
          titre="Bouton des promotions"
          defaut={CONTENUS_DEFAUT["promos.bouton"]}
        />
        <IconArrow className="h-4 w-4" />
      </Link>
    </section>
  );
}
