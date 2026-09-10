import GestionPrestations from "@/components/admin/GestionPrestations";
import { chargerReglages } from "@/lib/donnees";
import { categoriesAdmin, prestationsAdmin } from "@/lib/donnees-admin";

export const metadata = { title: "Prestations — CYLIA" };

export default async function PagePrestations() {
  const [categories, prestations, reglages] = await Promise.all([
    categoriesAdmin(),
    prestationsAdmin(),
    chargerReglages(),
  ]);

  return (
    <div>
      <h1 className="font-serif text-2xl font-light text-cream">Prestations</h1>
      <p className="mt-1 text-sm font-light leading-relaxed text-white/45">
        La durée décide des créneaux proposés à la réservation. Une prestation
        masquée disparaît du site sans effacer les rendez-vous passés.
      </p>

      <GestionPrestations
        categories={categories}
        prestations={prestations}
        devise={reglages.devise}
      />
    </div>
  );
}
