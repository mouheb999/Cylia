import GestionCategoriesPacks from "@/components/admin/GestionCategoriesPacks";
import GestionPacks from "@/components/admin/GestionPacks";
import PhotoUnique from "@/components/admin/PhotoUnique";
import {
  categoriesPacksAdmin,
  contenusAdmin,
  packsAdmin,
  prestationsAdmin,
} from "@/lib/donnees-admin";

export const metadata = { title: "Packs — CYLIA" };

export default async function PagePacks() {
  const [packsBruts, prestations, contenus] = await Promise.all([
    packsAdmin(),
    prestationsAdmin(),
    contenusAdmin(),
  ]);
  const { categories, packs } = await categoriesPacksAdmin(packsBruts, contenus);

  return (
    <div>
      <h1 className="font-serif text-2xl font-light text-cream">Packs</h1>
      <p className="mt-1 text-sm font-light leading-relaxed text-white/45">
        L&apos;accueil montre une seule grande carte « Nos packs ». Elle ouvre
        la page des packs, où chaque catégorie — hammam, mariée… — a sa carte,
        qui ouvre ses formules. Chaque pack a sa fiche : les photos, le
        déroulé, la durée, et le bouton qui le réserve.
      </p>

      <section className="mt-7">
        <h2 className="font-serif text-lg font-light text-gold">Carte de l&apos;accueil</h2>
        <div className="mt-3">
          <PhotoUnique
            cle="packs.image"
            titre="Photo de la carte « Nos packs »"
            description="La grande carte de l'accueil. Sans photo déposée, c'est celle de la première catégorie qui s'affiche."
            valeur={contenus["packs.image"] ?? ""}
            dossier="packs"
            apercu="aspect-[4/3] w-full"
          />
        </div>
      </section>

      <section className="mt-9">
        <h2 className="font-serif text-lg font-light text-gold">Catégories</h2>
        <p className="mt-1 mb-3 text-xs font-light leading-relaxed text-white/40">
          Dans l&apos;ordre de cette liste sur la page des packs. Une catégorie
          sans pack visible ne s&apos;affiche pas.
        </p>
        <GestionCategoriesPacks categories={categories} packs={packs} />
      </section>

      <section className="mt-9">
        <h2 className="font-serif text-lg font-light text-gold">Les packs</h2>
        <p className="mt-1 mb-3 text-xs font-light leading-relaxed text-white/40">
          Rangez chacun dans sa catégorie depuis « Modifier ».
        </p>
        <GestionPacks packs={packs} prestations={prestations} categories={categories} />
      </section>
    </div>
  );
}
