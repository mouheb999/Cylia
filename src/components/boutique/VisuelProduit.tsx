import PhotoDistante from "@/components/PhotoDistante";

/**
 * Visuel d'un produit.
 *
 * Les photos du catalogue sont des packshots **détourés** : le flacon est seul,
 * sur du transparent. Posées sur un fond noir, elles donnaient un carré sombre
 * par produit — et `object-cover` recadrait au passage des images qui ne sont
 * pas carrées, coupant le bouchon ou l'étiquette. D'où le fond clair et
 * `object-contain` : le flacon tient entier dans sa vignette, comme sur un
 * présentoir.
 *
 * Sans photo, plutôt qu'un rectangle vide ou une icône d'image cassée, on
 * dessine l'initiale du produit en doré. La vitrine reste présentable le temps
 * que le salon photographie ses flacons, et l'absence de photo ne ressemble pas
 * à une panne.
 *
 * Ce même dessin sert de dernier recours à `PhotoDistante` : une photo qui
 * existe mais que l'optimiseur refuse de servir donne l'initiale, jamais la
 * vignette cassée du navigateur.
 */
export default function VisuelProduit({
  nom,
  marque,
  url,
  sizes = "50vw",
  padding = "p-4",
  compact = false,
  className = "",
}: {
  nom: string;
  marque?: string;
  url: string | null;
  sizes?: string;
  /**
   * Marge autour du flacon : à ajuster à la taille de la vignette.
   *
   * À garder serrée sur les grands formats. Les packshots portent déjà leur
   * propre blanc tournant — parfois un bandeau de prix ou un macaron de
   * concours en haut — et l'ajouter à une marge large laissait le flacon
   * flotter au milieu d'un carré vide. Quelques pixels suffisent à le décoller
   * du bord.
   */
  padding?: string;
  /** Vignette de quelques dizaines de pixels : initiale plus petite, sans marque. */
  compact?: boolean;
  className?: string;
}) {
  const repli = (
    <div aria-hidden="true" className="flex h-full flex-col items-center justify-center">
      <span className={`font-script text-gold-deep/70 ${compact ? "text-2xl" : "text-5xl"}`}>
        {nom.trim().charAt(0) || "C"}
      </span>
      {marque && !compact && (
        <span className="mt-1 text-[0.55rem] uppercase tracking-[0.25em] text-muted/70">
          {marque}
        </span>
      )}
    </div>
  );

  return (
    <div className={`absolute inset-0 bg-gradient-to-b from-cream to-white ${className}`}>
      {url ? (
        <PhotoDistante
          src={url}
          alt={nom}
          fill
          sizes={sizes}
          className={`object-contain ${padding}`}
          repli={repli}
        />
      ) : (
        repli
      )}
    </div>
  );
}
