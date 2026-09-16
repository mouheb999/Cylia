import GestionPromotions from "@/components/admin/GestionPromotions";
import { chargerReglages } from "@/lib/donnees";
import { categoriesAdmin, prestationsAdmin } from "@/lib/donnees-admin";

export const metadata = { title: "Promotions — CYLIA" };

export default async function PagePromotions() {
  const [categories, prestations, reglages] = await Promise.all([
    categoriesAdmin(),
    prestationsAdmin(),
    chargerReglages(),
  ]);

  return (
    <div>
      <h1 className="font-serif text-2xl font-light text-cream">Promotions</h1>
      <p className="mt-1 text-sm font-light leading-relaxed text-white/45">
        Posez un tarif réduit sur les prestations de votre choix. Elles
        s&apos;affichent alors dans la section « Promotions » de l&apos;accueil,
        prix d&apos;origine barré, et le rendez-vous est compté au tarif de
        l&apos;offre.
      </p>

      <GestionPromotions
        prestations={prestations}
        categories={categories}
        devise={reglages.devise}
      />
    </div>
  );
}
