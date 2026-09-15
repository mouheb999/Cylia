import Link from "next/link";
import IndicateurLien from "@/components/ui/IndicateurLien";
import ListeReservations from "@/components/admin/ListeReservations";
import { chargerReglages } from "@/lib/donnees";
import { reservationsAdmin } from "@/lib/donnees-admin";
import { maintenantSalon } from "@/lib/temps-salon";

export const metadata = { title: "Réservations — CYLIA" };

const VUES = [
  { id: "a-venir", label: "À venir" },
  { id: "jour", label: "Aujourd'hui" },
  { id: "a-confirmer", label: "À confirmer" },
  { id: "passees", label: "Passées" },
] as const;

export default async function PageReservations({
  searchParams,
}: PageProps<"/admin/reservations">) {
  const parametres = await searchParams;
  const demandee = typeof parametres.vue === "string" ? parametres.vue : "a-venir";
  const vue = VUES.some((v) => v.id === demandee) ? demandee : "a-venir";
  const aujourdhui = maintenantSalon().dateCle;

  const filtre =
    vue === "jour"
      ? { depuis: aujourdhui, jusqua: aujourdhui }
      : vue === "passees"
        ? { jusqua: aujourdhui }
        : vue === "a-confirmer"
          // Sans borne de date, et c'est le correctif : une demande jamais
          // traitée disparaissait de cette vue le jour où son créneau
          // passait. La cliente, elle, attendait toujours une réponse. Les
          // dates passées remontent en tête — l'ordre est croissant.
          ? { statut: "en_attente" as const }
          : { depuis: aujourdhui };

  const [reservations, reglages] = await Promise.all([
    reservationsAdmin(filtre),
    chargerReglages(),
  ]);

  // Les vues « passées » se lisent du plus récent au plus ancien.
  const ordonnees = vue === "passees" ? [...reservations].reverse() : reservations;

  return (
    <div>
      <h1 className="font-serif text-2xl font-light text-cream">Réservations</h1>

      <div className="-mx-4 mt-4 overflow-x-auto px-4">
        <div className="flex gap-2">
          {VUES.map((v) => (
            <Link
              key={v.id}
              href={`/admin/reservations?vue=${v.id}`}
              aria-current={v.id === vue ? "page" : undefined}
              prefetch
              className={`press relative whitespace-nowrap rounded-full border px-4 py-2 text-sm ${
                v.id === vue
                  ? "border-gold bg-gold/15 text-gold"
                  : "border-white/15 text-white/55"
              }`}
            >
              {v.label}
              <IndicateurLien className="absolute inset-x-3 bottom-1" />
            </Link>
          ))}
        </div>
      </div>

      <ListeReservations
        reservations={ordonnees}
        devise={reglages.devise}
        aujourdhui={aujourdhui}
      />
    </div>
  );
}
