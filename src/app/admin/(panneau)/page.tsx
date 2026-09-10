import Link from "next/link";
import { commandesAdmin, reservationsAdmin, statistiques } from "@/lib/donnees-admin";
import { chargerReglages } from "@/lib/donnees";
import { formatDateLongue, formatHorodatage, formatPrix, minutesVersHeure } from "@/lib/format";
import { maintenantSalon } from "@/lib/temps-salon";

export const metadata = { title: "Tableau de bord — CYLIA" };

function Chiffre({
  valeur,
  libelle,
  accent = false,
}: {
  valeur: string | number;
  libelle: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border px-4 py-4 ${
        accent ? "border-gold/40 bg-gold/[0.08]" : "border-white/10 bg-white/[0.03]"
      }`}
    >
      <p
        className={`font-serif text-2xl lining-nums ${accent ? "text-gold" : "text-cream"}`}
      >
        {valeur}
      </p>
      <p className="mt-1 text-[0.7rem] font-light leading-snug text-white/50">{libelle}</p>
    </div>
  );
}

export default async function PageTableauDeBord() {
  const aujourdhui = maintenantSalon().dateCle;

  const [chiffres, duJour, dernieresCommandes, reglages] = await Promise.all([
    statistiques(),
    reservationsAdmin({ depuis: aujourdhui, jusqua: aujourdhui }),
    commandesAdmin(),
    chargerReglages(),
  ]);

  const actifsDuJour = duJour.filter((r) => r.statut !== "annulee");
  const enAttente = dernieresCommandes.filter((c) => c.statut === "en_attente");

  return (
    <div>
      <h1 className="font-serif text-2xl font-light text-cream">Tableau de bord</h1>
      <p className="mt-1 text-sm font-light text-white/45">{formatDateLongue(aujourdhui)}</p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <Chiffre valeur={chiffres.rdv_aujourdhui ?? 0} libelle="rendez-vous aujourd'hui" accent />
        <Chiffre valeur={chiffres.rdv_a_confirmer ?? 0} libelle="à confirmer" accent={(chiffres.rdv_a_confirmer ?? 0) > 0} />
        <Chiffre valeur={chiffres.rdv_semaine ?? 0} libelle="rendez-vous sur 7 jours" />
        <Chiffre
          valeur={chiffres.commandes_a_traiter ?? 0}
          libelle="commandes à traiter"
          accent={(chiffres.commandes_a_traiter ?? 0) > 0}
        />
        <Chiffre
          valeur={formatPrix(chiffres.chiffre_mois ?? 0, reglages.devise)}
          libelle="boutique, ce mois-ci"
        />
        <Chiffre
          valeur={chiffres.rupture_stock ?? 0}
          libelle="produits en rupture"
          accent={(chiffres.rupture_stock ?? 0) > 0}
        />
      </div>

      <section className="mt-8">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-serif text-xl font-light text-cream">Aujourd&apos;hui</h2>
          <Link href="/admin/reservations" className="text-xs font-light text-gold">
            Tout voir
          </Link>
        </div>

        {actifsDuJour.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-6 text-center text-sm font-light text-white/45">
            Aucun rendez-vous aujourd&apos;hui.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {actifsDuJour.map((r) => (
              <li
                key={r.id}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
              >
                <span className="font-serif text-lg text-gold lining-nums">
                  {minutesVersHeure(r.heure_minutes)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-cream">{r.nom}</span>
                  <span className="block truncate text-xs font-light text-white/45">
                    {r.prestations_nom.join(" · ")}
                  </span>
                </span>
                {r.statut === "en_attente" && (
                  <span className="shrink-0 rounded-full border border-gold/40 px-2 py-0.5 text-[0.6rem] text-gold">
                    à confirmer
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-serif text-xl font-light text-cream">Commandes à traiter</h2>
          <Link href="/admin/commandes" className="text-xs font-light text-gold">
            Tout voir
          </Link>
        </div>

        {enAttente.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-6 text-center text-sm font-light text-white/45">
            Aucune commande en attente.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {enAttente.slice(0, 6).map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm text-cream">{c.nom}</span>
                  <span className="block text-xs font-light text-white/45">
                    {formatHorodatage(c.cree_le)} · {c.ville}
                  </span>
                </span>
                <span className="shrink-0 font-serif text-base text-gold lining-nums">
                  {formatPrix(c.total, reglages.devise)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
