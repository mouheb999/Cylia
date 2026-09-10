import Link from "next/link";
import { Texte } from "@/components/edition/Modifiable";
import { CONTENUS_DEFAUT } from "@/lib/contenu";
import { formatPrix } from "@/lib/format";
import type { Produit } from "@/lib/supabase/types";
import VisuelProduit from "./boutique/VisuelProduit";
import { IconArrow } from "./Icons";

/** Aperçu de la boutique sur l'accueil : trois produits et un lien. */
export default function EncartBoutique({
  produits,
  devise,
}: {
  produits: Produit[];
  devise: string;
}) {
  if (produits.length === 0) return null;

  return (
    <section id="boutique" className="bg-cream px-4 pb-10 pt-2">
      <div className="mb-5 text-center">
        <Texte
          cle="boutique.accueil_surtitre"
          titre="Sur-titre de l'encart boutique"
          defaut={CONTENUS_DEFAUT["boutique.accueil_surtitre"]}
          balise="p"
          className="text-[10px] uppercase tracking-[0.3em] text-gold-deep"
        />
        <Texte
          cle="boutique.accueil_titre"
          titre="Titre de l'encart boutique"
          defaut={CONTENUS_DEFAUT["boutique.accueil_titre"]}
          balise="h2"
          className="mt-2 font-serif text-2xl font-light text-ink"
        />
        <Texte
          cle="boutique.accueil_texte"
          titre="Texte de l'encart boutique"
          type="multiligne"
          defaut={CONTENUS_DEFAUT["boutique.accueil_texte"]}
          balise="p"
          className="mx-auto mt-2 max-w-[24rem] whitespace-pre-line text-[0.8rem] font-light leading-relaxed text-muted"
        />
      </div>

      <ul className="grid grid-cols-3 gap-2.5">
        {produits.slice(0, 3).map((produit) => (
          <li key={produit.id}>
            <Link href={`/boutique/${produit.slug}`} className="block">
              <div className="relative aspect-square overflow-hidden rounded-xl bg-noir">
                <VisuelProduit
                  nom={produit.nom}
                  marque={produit.marque}
                  url={produit.image_url}
                  sizes="33vw"
                />
              </div>
              <p className="mt-1.5 line-clamp-2 text-[0.7rem] font-light leading-snug text-ink">
                {produit.nom}
              </p>
              <p className="text-[0.7rem] text-gold-deep lining-nums">
                {formatPrix(produit.prix, devise)}
              </p>
            </Link>
          </li>
        ))}
      </ul>

      <Link
        href="/boutique"
        className="mx-auto mt-5 flex w-full max-w-[20rem] items-center justify-center gap-2 rounded-full border border-gold-deep/40 py-3 font-serif text-base text-gold-deep"
      >
        <Texte
          cle="boutique.accueil_bouton"
          titre="Bouton de l'encart boutique"
          defaut={CONTENUS_DEFAUT["boutique.accueil_bouton"]}
        />
        <IconArrow className="h-4 w-4" />
      </Link>
    </section>
  );
}
