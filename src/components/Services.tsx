import Link from "next/link";
import type { Categorie } from "@/lib/supabase/types";
import { IconArrow, IconBienEtre, IconCoiffure, IconEsthetique } from "./Icons";

/**
 * Les trois cartes de l'accueil sont les catégories du catalogue.
 *
 * Une seule source : renommer « Bien-être » dans le panneau change la carte,
 * l'onglet du tunnel de réservation et le regroupement des prestations.
 */
const ICONES: Record<string, typeof IconCoiffure> = {
  coiffure: IconCoiffure,
  esthetique: IconEsthetique,
  "bien-etre": IconBienEtre,
};

export default function Services({ categories }: { categories: Categorie[] }) {
  if (categories.length === 0) return null;

  return (
    <section id="services" className="bg-cream px-4 pb-6 pt-8">
      <ul
        className={`grid grid-cols-1 gap-3 ${
          categories.length >= 3 ? "min-[360px]:grid-cols-3" : "min-[360px]:grid-cols-2"
        }`}
      >
        {categories.map((categorie) => {
          const Icone = ICONES[categorie.id] ?? IconEsthetique;
          return (
            <li key={categorie.id}>
              <Link
                href={`/reserver?categorie=${encodeURIComponent(categorie.id)}`}
                className="flex h-full flex-col items-center rounded-2xl border border-sand bg-white px-2.5 py-5 text-center shadow-[0_2px_12px_rgba(42,37,33,0.04)]"
              >
                <Icone className="h-10 w-10 text-gold-deep" />
                <h2 className="mt-3 font-serif text-[1.05rem] font-medium text-ink">
                  {categorie.nom}
                </h2>
                <p className="mt-1.5 text-[0.7rem] font-light leading-snug text-muted">
                  {categorie.description}
                </p>
                <IconArrow className="mt-auto box-content h-4 w-4 pt-3 text-gold-deep" />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
