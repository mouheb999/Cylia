import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import BoutonAjouter from "@/components/boutique/BoutonAjouter";
import LienConseil from "@/components/boutique/LienConseil";
import PrixFiche from "@/components/boutique/PrixFiche";
import VisuelProduit from "@/components/boutique/VisuelProduit";
import VueMeta from "@/components/boutique/VueMeta";
import { chargerContenus, chargerProduit, chargerReglages } from "@/lib/donnees";
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

  return (
    <>
      <Header />
      <main className="flex-1 bg-cream">
        <VueMeta id={produit.id} name={produit.nom} priceTnd={produit.prix} />
        <div className="relative aspect-square w-full">
          <VisuelProduit
            nom={produit.nom}
            marque={produit.marque}
            url={produit.image_url}
            sizes="100vw"
            padding="p-3"
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

          <PrixFiche
            prix={produit.prix}
            prixBarre={produit.ancien_prix}
            devise={reglages.devise}
            livraison={reglages.boutique_active}
          />

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

          <BoutonAjouter
            produitId={produit.id}
            nom={produit.nom}
            prix={produit.prix}
            epuise={produit.stock <= 0}
            stock={produit.stock}
          />

          <LienConseil nom={produit.nom} />

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
