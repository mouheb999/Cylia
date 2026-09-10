import Link from "next/link";
import ListeCommandes from "@/components/admin/ListeCommandes";
import { chargerReglages } from "@/lib/donnees";
import { commandesAdmin } from "@/lib/donnees-admin";

export const metadata = { title: "Commandes — CYLIA" };

const VUES = [
  { id: "toutes", label: "Toutes", statut: undefined },
  { id: "en_attente", label: "À traiter", statut: "en_attente" },
  { id: "confirmee", label: "Confirmées", statut: "confirmee" },
  { id: "expediee", label: "Expédiées", statut: "expediee" },
  { id: "livree", label: "Livrées", statut: "livree" },
] as const;

export default async function PageCommandes({ searchParams }: PageProps<"/admin/commandes">) {
  const parametres = await searchParams;
  const demandee = typeof parametres.vue === "string" ? parametres.vue : "toutes";
  const vue = VUES.find((v) => v.id === demandee) ?? VUES[0];

  const [commandes, reglages] = await Promise.all([
    commandesAdmin(vue.statut),
    chargerReglages(),
  ]);

  return (
    <div>
      <h1 className="font-serif text-2xl font-light text-cream">Commandes cosmétiques</h1>

      <div className="-mx-4 mt-4 overflow-x-auto px-4">
        <div className="flex gap-2">
          {VUES.map((v) => (
            <Link
              key={v.id}
              href={`/admin/commandes?vue=${v.id}`}
              aria-current={v.id === vue.id ? "page" : undefined}
              className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm ${
                v.id === vue.id
                  ? "border-gold bg-gold/15 text-gold"
                  : "border-white/15 text-white/55"
              }`}
            >
              {v.label}
            </Link>
          ))}
        </div>
      </div>

      <ListeCommandes commandes={commandes} devise={reglages.devise} />
    </div>
  );
}
