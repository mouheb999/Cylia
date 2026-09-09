import Image from "next/image";

const photos = [
  { src: "/galerie-1.jpg", alt: "Brushing wavy réalisé au salon CYLIA" },
  { src: "/galerie-2.jpg", alt: "Coiffeuse CYLIA en plein soin capillaire" },
  { src: "/galerie-3.jpg", alt: "Coloration blond polaire signée CYLIA" },
  { src: "/galerie-4.jpg", alt: "Cliente après un soin visage chez CYLIA" },
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
            key={photo.src}
            className="relative aspect-[4/5] overflow-hidden rounded-xl bg-sand"
          >
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              sizes="50vw"
              className="object-cover"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
