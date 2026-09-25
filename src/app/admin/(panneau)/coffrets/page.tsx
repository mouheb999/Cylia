import GestionCoffrets from "@/components/admin/GestionCoffrets";
import { coffretsAdmin, produitsAdmin } from "@/lib/donnees-admin";

export const metadata = { title: "Coffrets — CYLIA" };

export default async function PageCoffrets() {
  const [coffrets, produits] = await Promise.all([coffretsAdmin(), produitsAdmin()]);

  return (
    <div>
      <h1 className="font-serif text-2xl font-light text-cream">Coffrets</h1>
      <p className="mt-1 text-sm font-light leading-relaxed text-white/45">
        Des produits de la boutique vendus ensemble, sous un prix. Déposez la
        photo du coffret, choisissez les produits qu&apos;il contient, ou les
        deux. Ils s&apos;affichent sur l&apos;accueil juste au-dessus de la
        boutique, dans l&apos;ordre de cette liste, et s&apos;ajoutent au
        panier comme un produit.
      </p>

      <div className="mt-7">
        <GestionCoffrets coffrets={coffrets} produits={produits} />
      </div>
    </div>
  );
}
