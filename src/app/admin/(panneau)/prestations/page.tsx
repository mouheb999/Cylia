import GestionPrestations from "@/components/admin/GestionPrestations";
import { chargerReglages } from "@/lib/donnees";
import { categoriesAdmin, groupesAdmin, prestationsAdmin } from "@/lib/donnees-admin";

export const metadata = { title: "Prestations — CYLIA" };

export default async function PagePrestations() {
  const [categories, groupes, prestations, reglages] = await Promise.all([
    categoriesAdmin(),
    groupesAdmin(),
    prestationsAdmin(),
    chargerReglages(),
  ]);

  return (
    <div>
      <h1 className="font-serif text-2xl font-light text-cream">Prestations</h1>
      <p className="mt-1 text-sm font-light leading-relaxed text-white/45">
        Les groupes rassemblent les prestations voisines — les massages,
        l&apos;épilation — et portent la photo vue à la réservation. La durée,
        elle, décide des créneaux proposés.
      </p>

      <GestionPrestations
        categories={categories}
        groupes={groupes}
        prestations={prestations}
        devise={reglages.devise}
      />
    </div>
  );
}
