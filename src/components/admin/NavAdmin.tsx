"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import IndicateurLien from "@/components/ui/IndicateurLien";

const ONGLETS = [
  { href: "/admin", label: "Tableau de bord" },
  { href: "/admin/reservations", label: "Réservations" },
  { href: "/admin/commandes", label: "Commandes" },
  { href: "/admin/prestations", label: "Prestations" },
  { href: "/admin/produits", label: "Produits" },
  { href: "/admin/promotions", label: "Promotions" },
  { href: "/admin/accueil", label: "Photos" },
  { href: "/admin/contenu", label: "Contenu" },
  { href: "/admin/reglages", label: "Réglages" },
];

export default function NavAdmin() {
  const chemin = usePathname();

  return (
    <nav aria-label="Sections du panneau" className="border-b border-white/8 bg-noir">
      <ul className="flex gap-1 overflow-x-auto px-3 py-2">
        {ONGLETS.map((onglet) => {
          const actif =
            onglet.href === "/admin" ? chemin === "/admin" : chemin.startsWith(onglet.href);
          return (
            <li key={onglet.href}>
              <Link
                href={onglet.href}
                aria-current={actif ? "page" : undefined}
                // Le panneau se parcourt d'un onglet à l'autre toute la journée :
                // ils tiennent tous en mémoire, autant les avoir sous la main.
                prefetch
                className={`press relative block whitespace-nowrap rounded-full px-4 py-2 text-sm ${
                  actif ? "bg-gold/15 text-gold" : "text-white/55"
                }`}
              >
                {onglet.label}
                <IndicateurLien className="absolute inset-x-3 bottom-1" />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
