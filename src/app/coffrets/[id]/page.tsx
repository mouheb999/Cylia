import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import BoutonAjouter from "@/components/boutique/BoutonAjouter";
import VisuelCoffret from "@/components/boutique/VisuelCoffret";
import VisuelProduit from "@/components/boutique/VisuelProduit";
import {
  cheminCoffret,
  produitsDuCoffret,
  stockDuCoffret,
  valeurSepareeDuCoffret,
  visuelsDuCoffret,
} from "@/lib/coffrets";
import {
  chargerCoffret,
  chargerCoffrets,
  chargerContenus,
  chargerProduits,
  chargerReglages,
} from "@/lib/donnees";
import { formatPrix } from "@/lib/format";
import { infosSite } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/coffrets/[id]">): Promise<Metadata> {
  const { id } = await params;
  const coffret = await chargerCoffret(id);
  if (!coffret) return { title: "Coffret — CYLIA Maison de Beauté" };
  return {
    title: `${coffret.nom} — CYLIA Maison de Beauté`,
    description:
      coffret.description || `${coffret.nom}, un coffret CYLIA Maison de Beauté livré partout en Tunisie.`,
  };
}

/**
 * La fiche d'un coffret — le pendant de celle d'un produit.
 *
 * On y voit le coffret en grand, ce qu'il contient (chaque flacon mène à sa
 * propre fiche), et de quoi le commander tout de suite.
 */
export default async function PageCoffret({ params }: PageProps<"/coffrets/[id]">) {
  const { id } = await params;
  const [coffret, coffrets, produits, reglages, contenus] = await Promise.all([
    chargerCoffret(id),
    chargerCoffrets(),
    chargerProduits(),
    chargerReglages(),
    chargerContenus(),
  ]);

  if (!coffret) notFound();

  const contenu = produitsDuCoffret(coffret, produits);
  const valeur = valeurSepareeDuCoffret(coffret, produits);
  const stock = stockDuCoffret(coffret, produits);
  const autres = coffrets.filter((c) => c.id !== coffret.id);

  return (
    <>
      <Header />
      <main className="flex-1 bg-cream">
        <div className="relative aspect-square w-full">
          <VisuelCoffret
            nom={coffret.nom}
            photos={visuelsDuCoffret(coffret, produits)}
            sizes="100vw"
          />
          {valeur !== null && (
            <span className="absolute left-4 top-4 rounded-full bg-noir/80 px-3 py-1 text-[0.65rem] uppercase tracking-[0.18em] text-gold">
              −{Math.round((1 - coffret.prix / valeur) * 100)} %
            </span>
          )}
        </div>

        <div className="px-5 pb-10 pt-6">
          <p className="text-[0.65rem] uppercase tracking-[0.25em] text-gold-deep">Coffret</p>
          <h1 className="mt-2 font-serif text-2xl font-light leading-tight text-ink">
            {coffret.nom}
          </h1>

          <p className="mt-3 flex items-baseline gap-3">
            <span className="font-serif text-[2rem] font-semibold leading-none text-gold-deep lining-nums">
              {formatPrix(coffret.prix, reglages.devise)}
            </span>
            {valeur !== null && (
              <span className="text-sm font-light text-muted line-through lining-nums">
                {formatPrix(valeur, reglages.devise)}
              </span>
            )}
          </p>
          {valeur !== null && (
            <p className="mt-1.5 text-xs font-light text-muted">
              Soit {formatPrix(valeur - coffret.prix, reglages.devise)} d&apos;économie par
              rapport aux produits achetés séparément.
            </p>
          )}

          {coffret.description && (
            <p className="mt-4 whitespace-pre-line text-[0.9rem] font-light leading-relaxed text-ink/80">
              {coffret.description}
            </p>
          )}

          {contenu.length > 0 && (
            <div className="mt-6">
              <h2 className="text-[0.65rem] uppercase tracking-[0.25em] text-gold-deep">
                Dans ce coffret
              </h2>
              <ul className="mt-3 space-y-2">
                {contenu.map((produit) => (
                  <li key={produit.id}>
                    <Link
                      href={`/boutique/${produit.slug}`}
                      className="flex items-center gap-3 rounded-2xl border border-sand bg-white p-2"
                    >
                      <span className="relative block h-14 w-14 shrink-0 overflow-hidden rounded-xl">
                        <VisuelProduit
                          nom={produit.nom}
                          marque={produit.marque}
                          url={produit.image_url}
                          sizes="56px"
                          padding="p-1"
                          compact
                        />
                      </span>
                      <span className="min-w-0 flex-1">
                        {produit.marque && (
                          <span className="block truncate text-[0.6rem] uppercase tracking-[0.18em] text-muted">
                            {produit.marque}
                          </span>
                        )}
                        <span className="block font-serif text-[0.9rem] leading-snug text-ink">
                          {produit.nom}
                        </span>
                      </span>
                      <span className="shrink-0 pr-1 text-xs font-light text-muted lining-nums">
                        {formatPrix(produit.prix, reglages.devise)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!reglages.boutique_active ? (
            <p className="mt-6 rounded-2xl border border-sand bg-white px-5 py-6 text-center text-sm font-light leading-relaxed text-muted">
              La boutique est momentanément fermée. Le coffret reste disponible au salon.
            </p>
          ) : (
            <>
              <p className="mt-5 text-xs font-light text-muted">
                {stock <= 0
                  ? "Épuisé pour le moment"
                  : stock <= 3
                    ? `Plus que ${stock} en stock`
                    : "En stock"}
                {" · "}Livraison partout en Tunisie, paiement à la livraison.
              </p>
              <BoutonAjouter coffretId={coffret.id} epuise={stock <= 0} stock={stock} />
            </>
          )}

          {autres.length > 0 && (
            <div className="mt-10">
              <h2 className="text-[0.65rem] uppercase tracking-[0.25em] text-gold-deep">
                Nos autres coffrets
              </h2>
              <ul className="mt-3 grid grid-cols-2 gap-3">
                {autres.map((autre) => (
                  <li key={autre.id}>
                    <Link
                      href={cheminCoffret(autre)}
                      className="block overflow-hidden rounded-2xl border border-sand bg-white"
                    >
                      <span className="relative block aspect-square">
                        <VisuelCoffret
                          nom={autre.nom}
                          photos={visuelsDuCoffret(autre, produits)}
                          sizes="50vw"
                        />
                      </span>
                      <span className="block px-3 pb-3 pt-2">
                        <span className="block font-serif text-[0.9rem] leading-snug text-ink">
                          {autre.nom}
                        </span>
                        <span className="mt-1 block font-serif text-base font-semibold text-gold-deep lining-nums">
                          {formatPrix(autre.prix, reglages.devise)}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Link href="/boutique" className="mt-6 block text-center text-sm font-light text-muted">
            ← Retour à la boutique
          </Link>
        </div>
      </main>
      <Footer site={infosSite(contenus)} />
    </>
  );
}
