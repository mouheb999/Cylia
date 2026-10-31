import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import LienSuivi from "@/components/LienSuivi";
import { Texte } from "@/components/edition/Modifiable";
import FluxReservation from "@/components/reservation/FluxReservation";
import { CONTENUS_DEFAUT } from "@/lib/contenu";
import {
  chargerCategories,
  chargerContenus,
  chargerGroupes,
  chargerPack,
  chargerPrestations,
  chargerReglages,
} from "@/lib/donnees";
import { prestationsDuPack } from "@/lib/packs";
import { infosSite } from "@/lib/site";
import { clesJours } from "@/lib/temps-salon";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Réserver — CYLIA Maison de Beauté",
  description:
    "Choisissez votre prestation, votre date et votre créneau chez CYLIA Maison de Beauté, Sousse.",
};

export default async function PageReservation({ searchParams }: PageProps<"/reserver">) {
  const [categories, groupes, prestations, reglages, contenus, parametres] = await Promise.all([
    chargerCategories(),
    chargerGroupes(),
    chargerPrestations(),
    chargerReglages(),
    chargerContenus(),
    searchParams,
  ]);

  const site = infosSite(contenus);
  const categorieDemandee = parametres.categorie;
  // Une offre de l'accueil ou une publicité arrive avec sa ou ses prestations
  // dans l'adresse : `?prestation=a` ou `?prestation=a,b`. Les identifiants
  // inconnus sont écartés ici, avant d'atteindre le panier.
  const connues = new Set(prestations.map((p) => p.id));
  const prestationsDemandees = [parametres.prestation]
    .flat()
    .flatMap((v) => (typeof v === "string" ? v.split(",") : []))
    .map((id) => id.trim())
    .filter((id) => connues.has(id));
  // « Réserver ce pack » arrive avec le pack : toutes ses prestations entrent
  // dans le panier, et son prix remplace leur somme.
  const packDemande =
    typeof parametres.pack === "string" ? await chargerPack(parametres.pack) : null;
  const incluses = packDemande ? prestationsDuPack(packDemande, prestations) : [];
  const packInitial =
    packDemande && incluses.length > 0
      ? {
          slug: typeof parametres.pack === "string" ? parametres.pack : "",
          nom: packDemande.nom,
          prix: packDemande.prix,
          prestationIds: incluses.map((p) => p.id),
        }
      : undefined;

  return (
    <>
      <Header />
      <main className="flex-1 bg-noir">
        {/*
          Bandeau court sur téléphone — 120 px au plus, titre sur une ligne :
          la barre d'étapes et les premiers choix doivent tenir dans le
          premier écran, sans défiler.
        */}
        <div className="max-h-[120px] overflow-hidden px-5 pb-4 pt-4 text-center sm:max-h-none sm:pb-8 sm:pt-8">
          <Texte
            cle="reserver.surtitre"
            titre="Sur-titre de la page réservation"
            defaut={CONTENUS_DEFAUT["reserver.surtitre"]}
            balise="p"
            className="text-[10px] uppercase tracking-[0.3em] text-gold"
          />
          <h1 className="mt-1.5 font-serif text-[1.65rem] font-light leading-tight text-cream sm:mt-3 sm:text-3xl">
            <Texte
              cle="reserver.titre"
              titre="Titre de la page réservation"
              defaut={CONTENUS_DEFAUT["reserver.titre"]}
            />{" "}
            <Texte
              cle="reserver.titre_script"
              titre="Titre manuscrit de la page réservation"
              defaut={CONTENUS_DEFAUT["reserver.titre_script"]}
              balise="span"
              className="font-script text-[2rem] text-gold sm:mt-0.5 sm:block sm:text-4xl"
            />
          </h1>
          <div className="gold-rule mx-auto mt-2 h-px w-16 sm:mt-4" aria-hidden="true" />
        </div>

        <FluxReservation
          categories={categories}
          groupes={groupes}
          prestations={prestations}
          joursCles={clesJours(reglages.jours_proposes)}
          devise={reglages.devise}
          telephoneSalon={site.telephoneLien}
          reservationActive={reglages.reservation_active}
          categorieInitiale={typeof categorieDemandee === "string" ? categorieDemandee : undefined}
          prestationsInitiales={prestationsDemandees}
          packInitial={packInitial}
        />
      </main>

      <footer className="bg-noir px-6 pb-10 text-center">
        <p className="text-[0.75rem] font-light leading-relaxed text-white/40">
          Une question&nbsp;? Appelez le{" "}
          <LienSuivi
            evenement="Contact"
            parametres={{ method: "phone" }}
            href={`tel:${site.telephoneLien}`}
            className="text-gold"
          >
            {site.telephone}
          </LienSuivi>
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
