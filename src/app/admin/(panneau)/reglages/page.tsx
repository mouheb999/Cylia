import GestionReglages from "@/components/admin/GestionReglages";
import { chargerReglages } from "@/lib/donnees";
import { fermeturesAdmin } from "@/lib/donnees-admin";

export const metadata = { title: "Réglages — CYLIA" };

export default async function PageReglages() {
  const [reglages, fermetures] = await Promise.all([chargerReglages(), fermeturesAdmin()]);

  return (
    <div>
      <h1 className="font-serif text-2xl font-light text-cream">Réglages</h1>
      <p className="mt-1 text-sm font-light leading-relaxed text-white/45">
        Ces valeurs commandent les créneaux proposés et les frais de la boutique.
      </p>

      <GestionReglages reglages={reglages} fermetures={fermetures} />
    </div>
  );
}
