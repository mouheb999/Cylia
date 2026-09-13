import Image from "next/image";
import { IconBienEtre, IconCoiffure, IconEsthetique } from "@/components/Icons";

const ICONES: Record<string, typeof IconCoiffure> = {
  coiffure: IconCoiffure,
  esthetique: IconEsthetique,
  "bien-etre": IconBienEtre,
};

/**
 * Photo d'une prestation, dans le tunnel de réservation.
 *
 * Sans photo — et le salon commence sans aucune — la vignette montre l'icône
 * de la catégorie sur un fond sombre. C'est volontairement discret : une
 * rangée d'icônes se lit comme un motif, là où une rangée de rectangles vides
 * se lirait comme une panne. Le jour où le salon dépose ses photos, elles
 * prennent la place sans que rien d'autre ne bouge.
 */
export default function VisuelPrestation({
  nom,
  categorieId,
  url,
  className = "",
  tailleIcone = "h-7 w-7",
}: {
  nom: string;
  categorieId: string;
  url: string | null;
  className?: string;
  /** L'icône de repli ne se voit plus sur un grand bandeau : à ajuster. */
  tailleIcone?: string;
}) {
  const Icone = ICONES[categorieId] ?? IconEsthetique;

  return (
    <span
      className={`relative block shrink-0 overflow-hidden rounded-xl bg-white/[0.06] ${className}`}
    >
      {url ? (
        <Image src={url} alt={nom} fill sizes="72px" className="object-cover" />
      ) : (
        <span className="flex h-full items-center justify-center" aria-hidden="true">
          <Icone className={`${tailleIcone} text-gold/45`} />
        </span>
      )}
    </span>
  );
}
