import CartePack from "./CartePack";
import type { Pack } from "@/lib/supabase/types";

/** Les packs en deux colonnes — la même grille sur l'accueil et sur /packs. */
export default function GrillePacks({ packs, devise }: { packs: Pack[]; devise: string }) {
  if (packs.length === 0) return null;

  return (
    <ul className="grid grid-cols-2 gap-3">
      {packs.map((pack) => (
        <li key={pack.id}>
          <CartePack pack={pack} devise={devise} />
        </li>
      ))}
    </ul>
  );
}
