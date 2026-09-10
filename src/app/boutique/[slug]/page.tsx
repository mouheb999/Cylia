import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import BoutonAjouter from "@/components/boutique/BoutonAjouter";
import VisuelProduit from "@/components/boutique/VisuelProduit";
import { chargerContenus, chargerProduit, chargerReglages } from "@/lib/donnees";
import { formatPrix } from "@/lib/format";
import { infosSite } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/boutique/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const produit = await chargerProduit(slug);
  if (!produit) return { title: "Produit — CYLIA Maison de Beauté" };
  return {
    title: `${produit.nom} — CYLIA Maison de Beauté`,
    description: produit.description || `${produit.nom}, disponible chez CYLIA Maison de Beauté.`,
  };
}

export default async function PageProduit({ params }: PageProps<"/boutique/[slug]">) {
  const { slug } = await params;
  const [produit, reglages, contenus] = await Promise.all([
    chargerProduit(slug),
    chargerReglages(),
    chargerContenus(),
  ]);

  if (!produit) notFound();

  const enPromo = produit.ancien_prix != null && produit.ancien_prix > produit.prix;

  return (
    <>
      <Header />
      <main className="flex-1 bg-cream">
        <div className="relative aspect-square w-full bg-noir">
          <VisuelProduit
            nom={produit.nom}
            marque={produit.marque}
            url={produit.image_url}
            sizes="100vw"
          />
        </div>

        <div className="px-5 pb-10 pt-6">
          {produit.marque && (
            <p className="text-[0.65rem] uppercase tracking-[0.25em] text-gold-deep">
              {produit.marque}
            </p>
          )}
          <h1 className="mt-2 font-serif text-2xl font-light leading-tight text-ink">
            {produit.nom}
          </h1>

          <p className="mt-3 flex items-baseline gap-3">
            <span className="font-serif text-2xl text-gold-deep lining-nums">
              {formatPrix(produit.prix, reglages.devise)}
            </span>
            {enPromo && produit.ancien_prix != null && (
              <span className="text-sm font-light text-muted line-through lining-nums">
                {formatPrix(produit.ancien_prix, reglages.devise)}
              </span>
            )}
          </p>

          {produit.description && (
            <p className="mt-4 text-[0.9rem] font-light leading-relaxed text-ink/80">
              {produit.description}
            </p>
          )}

          <p className="mt-4 text-xs font-light text-muted">
            {produit.stock > 0
              ? produit.stock <= 3
                ? `Plus que ${produit.stock} en stock`
                : "En stock"
              : "Épuisé pour le moment"}
          </p>

          <BoutonAjouter produitId={produit.id} epuise={produit.stock <= 0} />

          <Link
            href="/boutique"
            className="mt-4 block text-center text-sm font-light text-muted"
          >
            ← Retour à la boutique
          </Link>
        </div>
      </main>
      <Footer site={infosSite(contenus)} />
    </>
  );
}
