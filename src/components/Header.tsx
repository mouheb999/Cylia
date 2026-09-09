"use client";

import { useState } from "react";
import Image from "next/image";
import { site } from "@/lib/site";
import { IconBag, IconClose, IconMenu } from "./Icons";

const liens = [
  { label: "Accueil", href: "#haut" },
  { label: "Services", href: "#services" },
  { label: "Galerie", href: "#galerie" },
  { label: "Contact", href: "#contact" },
];

export default function Header() {
  const [ouvert, setOuvert] = useState(false);

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
          {ouvert ? (
            <IconClose className="h-6 w-6" />
          ) : (
            <IconMenu className="h-6 w-6" />
          )}
        </button>

        <a href="#haut" aria-label={site.nom} className="justify-self-center">
          <Image
            src="/logo.png"
            alt="CYLIA Maison de Beauté"
            width={512}
            height={512}
            priority
            className="h-16 w-16"
          />
        </a>

        <a
          href={site.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Boutique — nous écrire sur WhatsApp"
          className="justify-self-end p-2 text-gold"
        >
          <IconBag className="h-6 w-6" />
        </a>
      </div>

      <nav
        id="menu-principal"
        hidden={!ouvert}
        className="border-t border-white/10 bg-noir px-6 pb-6 pt-2"
      >
        <ul>
          {liens.map((lien) => (
            <li key={lien.href} className="border-b border-white/5 last:border-0">
              <a
                href={lien.href}
                onClick={() => setOuvert(false)}
                className="block py-3.5 font-serif text-lg tracking-wide text-cream"
              >
                {lien.label}
              </a>
            </li>
          ))}
        </ul>
        <a
          href={site.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setOuvert(false)}
          className="gold-gradient mt-5 block rounded-full py-3 text-center text-sm font-medium tracking-[0.18em] text-noir uppercase"
        >
          Réserver
        </a>
      </nav>
    </header>
  );
}
