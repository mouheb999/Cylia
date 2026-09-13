"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import logo from "@/images/logo.png";
import { usePanier } from "@/lib/panier";
import { totalArticles, usePanierBoutique } from "@/lib/panier-boutique";
import { useEdition } from "@/components/edition/ContexteEdition";
import { IconAgenda, IconBag, IconClose, IconMenu } from "./Icons";

const liens = [
  { label: "Accueil", href: "/" },
  { label: "Services", href: "/#services" },
  { label: "Boutique", href: "/boutique" },
  { label: "Galerie", href: "/#galerie" },
  { label: "Contact", href: "/#contact" },
  { label: "Réserver", href: "/reserver" },
];

/** Lien d'en-tête portant une pastille quand quelque chose attend. */
function Lien({
  href,
  libelle,
  compte,
  children,
}: {
  href: string;
  libelle: string;
  compte: number;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} aria-label={libelle} className="relative p-2 text-gold">
      {children}
      {compte > 0 && (
        <span
          aria-hidden="true"
          className="gold-gradient absolute right-0 top-0 flex h-[1.15rem] min-w-[1.15rem] items-center justify-center rounded-full px-1 text-[0.65rem] font-medium text-noir"
        >
          {compte}
        </span>
      )}
    </Link>
  );
}

export default function Header() {
  const [ouvert, setOuvert] = useState(false);
  const prestations = usePanier();
  const articles = totalArticles(usePanierBoutique());
  const edition = useEdition();

  const nom = edition.valeur("site.nom", "CYLIA Maison de Beauté");
  const logoPersonnalise = edition.valeur("logo.image", "");

  // Deux gestes, deux boutons. Le sac ne servait à la fois de panier et
  // d'entrée de réservation, et changeait de destination selon son contenu :
  // impossible de savoir où il menait avant de l'avoir touché. Le sac est
  // maintenant celui de la boutique, et rien d'autre ; l'agenda mène au
  // rendez-vous.

  return (
    <header className="sticky top-0 z-50 bg-noir/95 backdrop-blur-sm">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center px-4 py-2.5">
        <button
          type="button"
          onClick={() => setOuvert((v) => !v)}
          aria-expanded={ouvert}
          aria-controls="menu-principal"
          aria-label={ouvert ? "Fermer le menu" : "Ouvrir le menu"}
          className="justify-self-start p-2 text-gold"
        >
          {ouvert ? <IconClose className="h-6 w-6" /> : <IconMenu className="h-6 w-6" />}
        </button>

        <Link href="/" aria-label={nom} className="justify-self-center">
          {logoPersonnalise ? (
            <Image src={logoPersonnalise} alt={nom} width={64} height={64} className="h-16 w-16 object-contain" />
          ) : (
            <Image src={logo} alt={nom} priority className="h-16 w-16" />
          )}
        </Link>

        <div className="flex items-center justify-self-end">
          <Lien
            href="/reserver"
            libelle={
              prestations.length === 0
                ? "Prendre rendez-vous"
                : `Votre rendez-vous : ${prestations.length} prestation${prestations.length > 1 ? "s" : ""}`
            }
            compte={prestations.length}
          >
            <IconAgenda className="h-6 w-6" />
          </Lien>

          <Lien
            href="/boutique/panier"
            libelle={
              articles === 0
                ? "Votre panier est vide — voir la boutique"
                : `Votre panier : ${articles} article${articles > 1 ? "s" : ""}`
            }
            compte={articles}
          >
            <IconBag className="h-6 w-6" />
          </Lien>
        </div>
      </div>

      <nav
        id="menu-principal"
        hidden={!ouvert}
        className="border-t border-white/10 bg-noir px-6 pb-6 pt-2"
      >
        <ul>
          {liens.map((lien) => (
            <li key={lien.href} className="border-b border-white/5 last:border-0">
              <Link
                href={lien.href}
                onClick={() => setOuvert(false)}
                className="block py-3.5 font-serif text-lg tracking-wide text-cream"
              >
                {lien.label}
              </Link>
            </li>
          ))}
        </ul>
        <Link
          href="/reserver"
          onClick={() => setOuvert(false)}
          className="gold-gradient mt-5 block rounded-full py-3 text-center text-sm font-medium uppercase tracking-[0.18em] text-noir"
        >
          Réserver
        </Link>
      </nav>
    </header>
  );
}
