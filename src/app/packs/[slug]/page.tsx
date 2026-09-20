import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { IconClock } from "@/components/Icons";
import DiaporamaPack from "@/components/packs/DiaporamaPack";
import GrillePacks from "@/components/packs/GrillePacks";
import LienSuivi from "@/components/LienSuivi";
import { chargerContenus, chargerPack, chargerPacks, chargerPrestations, chargerReglages } from "@/lib/donnees";
import { formatDuree, formatPrix } from "@/lib/format";
import {
  dureeDuPack,
  inclusionsDuPack,
  lienReservationPack,
  photosDuPack,
} from "@/lib/packs";
import { infosSite } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/packs/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const pack = await chargerPack(slug);
  if (!pack) return { title: "Pack — CYLIA Maison de Beauté" };
  return {
    title: `${pack.nom} — CYLIA Maison de Beauté`,
    description:
      pack.description || `${pack.nom}, une formule de CYLIA Maison de Beauté, à Sousse.`,
  };
}

/**
 * La fiche d'un pack.
 *
 * C'est la page qui manquait. Toucher un pack sur l'accueil menait droit au
 * tunnel de réservation, où la formule n'apparaissait nulle part : la cliente
 * se retrouvait devant une liste de prestations sans savoir laquelle cocher.
 * Ici, elle voit la cabine, lit ce que le rituel comprend, sa durée, son
 * tarif — et ne réserve qu'ensuite, en un bouton qui dépose la bonne
 * prestation dans le panier.
 *
 * Les autres packs suivent, en bas : c'est le moment où l'on compare, et le
 * seul endroit où la comparaison ne coûte pas un retour en arrière.
 */
export default async function PagePack({ params }: PageProps<"/packs/[slug]">) {
  const { slug } = await params;
  const [pack, packs, prestations, reglages, contenus] = await Promise.all([
    chargerPack(slug),
    chargerPacks(),
    chargerPrestations(),
    chargerReglages(),
    chargerContenus(),
  ]);

  if (!pack) notFound();

  const site = infosSite(contenus);
  const photos = photosDuPack(pack);
  const inclusions = inclusionsDuPack(pack);
  const duree = dureeDuPack(pack, prestations);
  const autres = packs.filter((p) => p.id !== pack.id);

  return (
    <>
      <Header />
      <main className="flex-1 bg-cream">
        <DiaporamaPack photos={photos} nom={pack.nom} />

        <div className="px-5 pb-10 pt-6">
          <p className="text-[0.65rem] uppercase tracking-[0.25em] text-gold-deep">Notre pack</p>
          <h1 className="mt-2 font-serif text-2xl font-light leading-tight text-ink">
            {pack.nom}
          </h1>

          <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-2">
            <span className="font-serif text-[2rem] font-semibold leading-none text-gold-deep lining-nums">
              {pack.prix === null ? "Sur devis" : formatPrix(pack.prix, reglages.devise)}
            </span>
            {duree !== null && (
              <span className="flex items-center gap-1.5 text-sm font-light text-muted">
                <IconClock className="h-4 w-4 text-gold-deep" />
                <span className="lining-nums">{formatDuree(duree)}</span>
              </span>
            )}
          </div>

          {pack.description && (
            <p className="mt-4 whitespace-pre-line text-[0.9rem] font-light leading-relaxed text-ink/80">
              {pack.description}
            </p>
          )}

          {inclusions.length > 0 && (
            <div className="mt-6 rounded-2xl border border-sand bg-white p-5">
              <p className="font-serif text-base text-ink">Ce que le pack comprend</p>
              <div className="gold-rule mt-3 h-px w-12" aria-hidden="true" />
              <ul className="mt-3 space-y-2">
                {inclusions.map((ligne, index) => (
                  <li
                    key={`${index}-${ligne}`}
                    className="flex gap-2.5 text-[0.85rem] font-light leading-relaxed text-ink/80"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-gold-deep"
                    />
                    {ligne}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {reglages.reservation_active ? (
            <Link
              href={lienReservationPack(pack, prestations)}
              className="gold-gradient press mt-6 flex w-full items-center justify-center rounded-full py-3.5 font-serif text-base text-noir"
            >
              Réserver ce pack
            </Link>
          ) : (
            <p className="mt-6 rounded-2xl border border-sand bg-white px-5 py-5 text-center text-sm font-light leading-relaxed text-muted">
              Les rendez-vous en ligne sont suspendus pour le moment. Appelez le
              salon, il vous réserve ce pack de vive voix.
            </p>
          )}

          <p className="mt-3 text-center text-xs font-light leading-relaxed text-muted">
            Une question sur cette formule&nbsp;?{" "}
            <LienSuivi
              evenement="Contact"
              parametres={{ method: "phone" }}
              href={`tel:${site.telephoneLien}`}
              className="text-gold-deep underline decoration-gold-deep/40 underline-offset-4"
            >
              {site.telephone}
            </LienSuivi>
          </p>

          {autres.length > 0 && (
            <section className="mt-10">
              <h2 className="text-center font-serif text-xl font-light text-ink">
                Nos autres packs
              </h2>
              <div className="gold-rule mx-auto mt-3 mb-5 h-px w-16" aria-hidden="true" />
              <GrillePacks packs={autres} devise={reglages.devise} />
            </section>
          )}

          <Link href="/packs" className="mt-6 block text-center text-sm font-light text-muted">
            ← Tous nos packs
          </Link>
        </div>
      </main>
      <Footer site={site} />
    </>
  );
}
