import { contenusAdmin } from "@/lib/donnees-admin";
import GestionContenu from "@/components/admin/GestionContenu";

export const metadata = { title: "Contenu — CYLIA" };

export default async function PageContenu() {
  const contenus = await contenusAdmin();

  return (
    <div>
      <h1 className="font-serif text-2xl font-light text-cream">Textes du site</h1>
      <p className="mt-1 text-sm font-light leading-relaxed text-white/45">
        Tous les textes du site, rassemblés ici pour une relecture d&apos;ensemble.
        Les photos des prestations et des produits se changent depuis leurs
        fiches, dans « Prestations » et « Produits ».
      </p>

      <GestionContenu contenus={contenus} />
    </div>
  );
}
