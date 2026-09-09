import { IconArrow, IconBienEtre, IconCoiffure, IconEsthetique } from "./Icons";
import { site } from "@/lib/site";

const services = [
  {
    titre: "Coiffure",
    description: "Coupe, couleur, soin & style",
    Icone: IconCoiffure,
  },
  {
    titre: "Esthétique",
    description: "Soins visage, épilation, ongles",
    Icone: IconEsthetique,
  },
  {
    titre: "Bien-être",
    description: "Massages, relaxation, équilibre",
    Icone: IconBienEtre,
  },
];

export default function Services() {
  return (
    <section id="services" className="bg-cream px-4 pb-6 pt-8">
      <ul className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-3">
        {services.map(({ titre, description, Icone }) => (
          <li key={titre}>
            <a
              href={site.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-full flex-col items-center rounded-2xl border border-sand bg-white px-2.5 py-5 text-center shadow-[0_2px_12px_rgba(42,37,33,0.04)]"
            >
              <Icone className="h-10 w-10 text-gold-deep" />
              <h2 className="mt-3 font-serif text-[1.05rem] font-medium text-ink">
                {titre}
              </h2>
              <p className="mt-1.5 text-[0.7rem] font-light leading-snug text-muted">
                {description}
              </p>
              <IconArrow className="mt-auto pt-3 h-4 w-4 box-content text-gold-deep" />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
