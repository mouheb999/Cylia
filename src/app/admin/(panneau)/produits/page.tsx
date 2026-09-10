import GestionProduits from "@/components/admin/GestionProduits";
import { chargerReglages } from "@/lib/donnees";
import { produitsAdmin } from "@/lib/donnees-admin";

export const metadata = { title: "Produits — CYLIA" };

export default async function PageProduits() {
  const [produits, reglages] = await Promise.all([produitsAdmin(), chargerReglages()]);

  return (
    <div>
      <h1 className="font-serif text-2xl font-light text-cream">Produits</h1>
      <p className="mt-1 text-sm font-light leading-relaxed text-white/45">
        Le stock diminue à chaque commande. À zéro, le produit reste affiché
        mais ne peut plus être commandé.
      </p>

      <GestionProduits produits={produits} devise={reglages.devise} />
    </div>
  );
}
