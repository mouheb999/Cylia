"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import logo from "@/images/logo.png";
import { usePanier } from "@/lib/panier";
import { totalArticles, usePanierBoutique } from "@/lib/panier-boutique";
import { useEdition } from "@/components/edition/ContexteEdition";
import { IconBag, IconClose, IconMenu } from "./Icons";

const liens = [
  { label: "Accueil", href: "/" },
  { label: "Services", href: "/#services" },
  { label: "Boutique", href: "/boutique" },
  { label: "Galerie", href: "/#galerie" },
  { label: "Contact", href: "/#contact" },
  { label: "Réserver", href: "/reserver" },
];

export default function Header() {
  const [ouvert, setOuvert] = useState(false);
  const prestations = usePanier();
  const articles = totalArticles(usePanierBoutique());
  const edition = useEdition();

  const nom = edition.valeur("site.nom", "CYLIA Maison de Beauté");
  const logoPersonnalise = edition.valeur("logo.image", "");

  // Le sac mène là où il y a quelque chose : la boutique si un produit attend,
  // le tunnel de réservation sinon.
  const sacVersBoutique = articles > 0;
  const total = sacVersBoutique ? articles : prestations.length;

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

        <Link
          href={sacVersBoutique ? "/boutique/panier" : "/reserver"}
          aria-label={
            total === 0
              ? "Votre sélection est vide — prendre rendez-vous"
              : sacVersBoutique
                ? `Votre panier : ${total} article${total > 1 ? "s" : ""}`
                : `Votre sélection : ${total} prestation${total > 1 ? "s" : ""}`
          }
          className="relative justify-self-end p-2 text-gold"
        >
          <IconBag className="h-6 w-6" />
          {total > 0 && (
            <span
              aria-hidden="true"
              className="gold-gradient absolute right-0 top-0 flex h-[1.15rem] min-w-[1.15rem] items-center justify-center rounded-full px-1 text-[0.65rem] font-medium text-noir"
            >
              {total}
            </span>
          )}
        </Link>
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
