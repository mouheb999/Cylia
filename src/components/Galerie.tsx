import Image from "next/image";
import galerie1 from "@/images/galerie-1.jpg";
import galerie2 from "@/images/galerie-2.jpg";
import galerie3 from "@/images/galerie-3.jpg";
import galerie4 from "@/images/galerie-4.jpg";

const photos = [
  { src: galerie1, alt: "L'espace d'accueil de la Maison de Beauté CYLIA" },
  { src: galerie2, alt: "Soin du visage en cabine à la Maison de Beauté CYLIA" },
  { src: galerie3, alt: "La réception CYLIA et son logo lumineux" },
  { src: galerie4, alt: "Linge brodé et pinceaux de maquillage CYLIA" },
];

export default function Galerie() {
  return (
    <section id="galerie" className="bg-cream px-4 pb-10">
      <div className="mb-5 text-center">
        <p className="text-[10px] uppercase tracking-[0.3em] text-gold-deep">
          Galerie
        </p>
        <h2 className="mt-2 font-serif text-2xl font-light text-ink">
          Nos réalisations
        </h2>
        <div className="gold-rule mx-auto mt-3 h-px w-16" aria-hidden="true" />
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {photos.map((photo) => (
          <div
            key={photo.src.src}
            className="relative aspect-[4/5] overflow-hidden rounded-xl bg-sand"
          >
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              placeholder="blur"
              sizes="50vw"
              className="object-cover"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
