import Image from "next/image";

/**
 * Visuel d'un produit.
 *
 * Sans photo, plutôt qu'un rectangle gris ou une icône d'image cassée, on
 * dessine un carré doré avec l'initiale du produit : la vitrine reste
 * présentable le temps que le salon photographie ses flacons.
 */
export default function VisuelProduit({
  nom,
  marque,
  url,
  sizes = "50vw",
  className = "",
}: {
  nom: string;
  marque?: string;
  url: string | null;
  sizes?: string;
  className?: string;
}) {
  if (url) {
    return <Image src={url} alt={nom} fill sizes={sizes} className={`object-cover ${className}`} />;
  }

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-noir-soft to-noir"
    >
      <span className="font-script text-5xl text-gold/70">{nom.trim().charAt(0) || "C"}</span>
      {marque && (
        <span className="mt-1 text-[0.55rem] uppercase tracking-[0.25em] text-white/35">
          {marque}
        </span>
      )}
    </div>
  );
}
