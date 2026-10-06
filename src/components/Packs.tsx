import GrandeCarte from "@/components/packs/GrandeCarte";
import { Texte } from "@/components/edition/Modifiable";
import { CONTENUS_DEFAUT } from "@/lib/contenu";
import { couverturePack, imageCategoriePack, libelleNombrePacks } from "@/lib/packs";
import type { CategoriePack, Pack } from "@/lib/supabase/types";

/**
 * « Nos packs » — une seule grande carte sur l'accueil.
 *
 * L'accueil alignait toutes les formules en grille ; avec les packs hammam,
 * mariée et les autres, la section devenait une liste à faire défiler. Une
 * seule carte suffit à dire « il y a des packs » : elle ouvre `/packs`, où la
 * cliente choisit sa catégorie, puis sa formule.
 *
 * La photo est celle que le salon dépose dans le panneau (« Packs » → photo
 * de l'accueil). À défaut, celle de la première catégorie, puis la couverture
 * du premier pack.
 *
 * Sans aucun pack, la section n'existe pas — comme les promotions.
 */
export default function Packs({
  packs,
  categories,
  image,
}: {
  packs: Pack[];
  categories: CategoriePack[];
  /** Photo choisie par le salon — "" tant qu'il n'en a déposé aucune. */
  image: string;
}) {
  if (packs.length === 0) return null;

  const photo =
    image ||
    categories.map((c) => imageCategoriePack(c, packs)).find(Boolean) ||
    packs.map(couverturePack).find(Boolean) ||
    null;

  const mention =
    categories.length > 1
      ? `${categories.length} catégories · ${libelleNombrePacks(packs.length)}`
      : libelleNombrePacks(packs.length);

  return (
    <section id="packs" className="scroll-mt-24 bg-cream px-4 pb-10 pt-4">
      <div className="mb-5 text-center">
        <Texte
          cle="packs.surtitre"
          titre="Sur-titre des packs"
          defaut={CONTENUS_DEFAUT["packs.surtitre"]}
          balise="p"
          className="text-[10px] uppercase tracking-[0.3em] text-gold-deep"
        />
        <Texte
          cle="packs.texte"
          titre="Texte des packs"
          type="multiligne"
          defaut={CONTENUS_DEFAUT["packs.texte"]}
          balise="p"
          className="mx-auto mt-2 max-w-[24rem] whitespace-pre-line text-[0.8rem] font-light leading-relaxed text-muted"
        />
      </div>

      <div className="mx-auto max-w-[40rem]">
        <GrandeCarte
          href="/packs"
          alt="Nos packs"
          titre={
            <Texte
              cle="packs.titre"
              titre="Titre des packs"
              defaut={CONTENUS_DEFAUT["packs.titre"]}
            />
          }
          image={photo}
          mention={mention}
          texte="Hammam, mariée et plus encore — découvrez nos formules."
        />
      </div>
    </section>
  );
}
