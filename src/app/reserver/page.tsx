import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import { Texte } from "@/components/edition/Modifiable";
import FluxReservation from "@/components/reservation/FluxReservation";
import { CONTENUS_DEFAUT } from "@/lib/contenu";
import {
  chargerCategories,
  chargerContenus,
  chargerPrestations,
  chargerReglages,
} from "@/lib/donnees";
import { infosSite } from "@/lib/site";
import { clesJours } from "@/lib/temps-salon";

export const metadata: Metadata = {
  title: "Réserver — CYLIA Maison de Beauté",
  description:
    "Choisissez votre prestation, votre date et votre créneau chez CYLIA Maison de Beauté, Sousse.",
};

export default async function PageReservation({ searchParams }: PageProps<"/reserver">) {
  const [categories, prestations, reglages, contenus, parametres] = await Promise.all([
    chargerCategories(),
    chargerPrestations(),
    chargerReglages(),
    chargerContenus(),
    searchParams,
  ]);

  const site = infosSite(contenus);
  const categorieDemandee = parametres.categorie;

  return (
    <>
      <Header />
      <main className="flex-1 bg-noir">
        <div className="px-5 pb-8 pt-8 text-center">
          <Texte
            cle="reserver.surtitre"
            titre="Sur-titre de la page réservation"
            defaut={CONTENUS_DEFAUT["reserver.surtitre"]}
            balise="p"
            className="text-[10px] uppercase tracking-[0.3em] text-gold"
          />
          <h1 className="mt-3 font-serif text-3xl font-light text-cream">
            <Texte
              cle="reserver.titre"
              titre="Titre de la page réservation"
              defaut={CONTENUS_DEFAUT["reserver.titre"]}
            />
            <Texte
              cle="reserver.titre_script"
              titre="Titre manuscrit de la page réservation"
              defaut={CONTENUS_DEFAUT["reserver.titre_script"]}
              balise="span"
              className="mt-0.5 block font-script text-4xl text-gold"
            />
          </h1>
          <div className="gold-rule mx-auto mt-4 h-px w-16" aria-hidden="true" />
        </div>

        <FluxReservation
          categories={categories}
          prestations={prestations}
          joursCles={clesJours(reglages.jours_proposes)}
          devise={reglages.devise}
          telephoneSalon={site.telephoneLien}
          reservationActive={reglages.reservation_active}
          categorieInitiale={typeof categorieDemandee === "string" ? categorieDemandee : undefined}
        />
      </main>

      <footer className="bg-noir px-6 pb-10 text-center">
        <p className="text-[0.75rem] font-light leading-relaxed text-white/40">
          Une question&nbsp;? Appelez le{" "}
          <a href={`tel:${site.telephoneLien}`} className="text-gold">
            {site.telephone}
          </a>
          <br />
          {site.horaires}
        </p>
        <Link href="/" className="mt-4 inline-block text-[0.75rem] font-light text-white/35">
          {site.nom}
        </Link>
      </footer>
    </>
  );
}
