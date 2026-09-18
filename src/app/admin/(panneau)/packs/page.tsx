import GestionPacks from "@/components/admin/GestionPacks";
import { packsAdmin } from "@/lib/donnees-admin";

export const metadata = { title: "Packs — CYLIA" };

export default async function PagePacks() {
  const packs = await packsAdmin();

  return (
    <div>
      <h1 className="font-serif text-2xl font-light text-cream">Packs</h1>
      <p className="mt-1 text-sm font-light leading-relaxed text-white/45">
        Les formules que le salon compose — pack mariée, pack hammam, une offre
        de saison. Elles s&apos;affichent sur l&apos;accueil, dans
        l&apos;ordre de cette liste, et mènent à la réservation.
      </p>

      <div className="mt-7">
        <GestionPacks packs={packs} />
      </div>
    </div>
  );
}
