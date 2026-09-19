"use client";

import { useEffect, useState } from "react";

/**
 * Page de diagnostic — à retirer une fois la panne comprise.
 *
 * Les deux logos du salon restent en vignette cassée sur le téléphone, alors
 * que tout ce qui peut être vérifié depuis l'atelier est sain : fichiers
 * valides, présents dans le commit, servis sans erreur en local, optimiseur de
 * l'hébergeur en pleine forme. Le site n'étant pas joignable depuis l'atelier,
 * cette page demande au téléphone lui-même ce qu'il obtient, et l'écrit en
 * grand.
 *
 * Elle n'est liée depuis nulle part : seule une personne qui connaît l'adresse
 * y arrive.
 */
const CIBLES = [
  { url: "/coiffure.png", quoi: "Logo coiffure (nouveau, public/)" },
  { url: "/esthetique.png", quoi: "Logo esthétique (nouveau, public/)" },
  { url: "/keune.png", quoi: "Logo Keune (nouveau, public/)" },
  { url: "/icone-192.png", quoi: "Icône de l'app (ancienne, public/)" },
  { url: "/badge.png", quoi: "Badge des alertes (ancien, public/)" },
];

type Resultat = {
  url: string;
  quoi: string;
  statut?: number | string;
  type?: string | null;
  taille?: string | null;
  signature?: string;
  chargement?: string;
  dimensions?: string;
};

export default function Diagnostic() {
  const [lignes, setLignes] = useState<Resultat[]>([]);

  useEffect(() => {
    (async () => {
      const sortie: Resultat[] = [];
      for (const cible of CIBLES) {
        const r: Resultat = { ...cible };

        // 1. ce que le réseau renvoie
        try {
          const rep = await fetch(cible.url, { cache: "no-store" });
          r.statut = rep.status;
          r.type = rep.headers.get("content-type");
          r.taille = rep.headers.get("content-length");
          const octets = new Uint8Array((await rep.arrayBuffer()).slice(0, 8));
          r.signature = Array.from(octets)
            .map((o) => o.toString(16).padStart(2, "0"))
            .join(" ");
        } catch (e) {
          r.statut = `échec réseau : ${e instanceof Error ? e.message : String(e)}`;
        }

        // 2. ce que le navigateur en fait comme image
        r.chargement = await new Promise<string>((ok) => {
          const i = new Image();
          i.onload = () => ok("chargée");
          i.onerror = () => ok("REFUSÉE par le navigateur");
          i.src = cible.url + "?t=" + Date.now();
          setTimeout(() => ok("délai dépassé"), 8000);
        });
        const img = new Image();
        img.src = cible.url;
        r.dimensions = `${img.naturalWidth}×${img.naturalHeight}`;

        sortie.push(r);
        setLignes([...sortie]);
      }
    })();
  }, []);

  return (
    <main style={{ padding: 16, font: "14px/1.5 monospace", background: "#fff", color: "#000" }}>
      <h1 style={{ fontSize: 18, fontWeight: 700 }}>Diagnostic des images</h1>
      <p style={{ margin: "8px 0 16px" }}>
        Une signature valide commence par <b>89 50 4e 47</b>.
      </p>
      {lignes.length === 0 && <p>Mesure en cours…</p>}
      {lignes.map((l) => (
        <div
          key={l.url}
          style={{
            border: "2px solid #000",
            borderRadius: 8,
            padding: 10,
            marginBottom: 12,
            background: l.chargement === "chargée" ? "#e7f7e7" : "#fde8e8",
          }}
        >
          <div style={{ fontWeight: 700 }}>{l.quoi}</div>
          <div>{l.url}</div>
          <div>statut HTTP : <b>{String(l.statut)}</b></div>
          <div>type : <b>{l.type ?? "—"}</b></div>
          <div>taille : <b>{l.taille ?? "—"}</b></div>
          <div>signature : <b>{l.signature ?? "—"}</b></div>
          <div>image : <b>{l.chargement}</b></div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={l.url} alt="" width={60} style={{ marginTop: 6, border: "1px solid #999" }} />
        </div>
      ))}
    </main>
  );
}
