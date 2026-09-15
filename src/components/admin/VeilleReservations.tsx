"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { reservationsDepuis } from "@/app/actions/veille";
import { clientNavigateur } from "@/lib/supabase/client";
import { supabaseConfigure } from "@/lib/supabase/config";
import { formatDateCourte, minutesVersHeure } from "@/lib/format";
import type { Reservation } from "@/lib/supabase/types";

/** Intervalle du filet de sécurité, onglet visible uniquement. */
const SONDAGE_MS = 45_000;

/**
 * Veille sur les nouvelles demandes.
 *
 * Deux chemins pour la même information, parce qu'aucun des deux n'est fiable
 * seul :
 *
 * - **Realtime** — Supabase pousse l'insertion dans la seconde. C'est ce qui
 *   fait apparaître un rendez-vous sans toucher à l'écran. Mais la connexion
 *   meurt en silence quand le téléphone se met en veille ou change de réseau.
 * - **Sondage** — une question toutes les 45 secondes, onglet visible
 *   seulement. Il rattrape ce que la connexion a perdu, et il fonctionne même
 *   si la publication Realtime n'a pas été activée en base.
 *
 * Les deux alimentent la même liste, dédoublonnée par identifiant : recevoir
 * deux fois la même demande ne la compte qu'une.
 */
export default function VeilleReservations() {
  const router = useRouter();
  const [nouvelles, setNouvelles] = useState<Reservation[]>([]);

  // `useRef` et non `useState` : ces valeurs sont lues par des abonnements qui
  // survivent aux rendus, elles ne doivent pas en déclencher.
  const depuis = useRef(new Date().toISOString());
  const connues = useRef(new Set<string>());

  const signaler = useCallback(
    (arrivees: Reservation[]) => {
      const inedites = arrivees.filter((r) => !connues.current.has(r.id));
      if (inedites.length === 0) return;

      for (const r of inedites) connues.current.add(r.id);
      for (const r of inedites) {
        if (r.cree_le > depuis.current) depuis.current = r.cree_le;
      }

      setNouvelles((liste) => [...inedites, ...liste].slice(0, 12));
      sonner();
      // La page ouverte se remet à jour d'elle-même : c'est là que la demande
      // apparaît dans la liste, sans que personne n'ait rechargé.
      router.refresh();
    },
    [router],
  );

  // ------------------------------------------------------------ temps réel
  useEffect(() => {
    if (!supabaseConfigure) return;

    let vivant = true;
    const supabase = clientNavigateur();
    const canal = supabase.channel("veille-reservations");

    (async () => {
      // Realtime applique RLS avec le jeton qu'on lui donne : sans cette
      // ligne, l'abonnement est anonyme et ne reçoit jamais rien.
      await supabase.realtime.setAuth();
      if (!vivant) return;

      canal
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "reservations" },
          (charge) => signaler([charge.new as Reservation]),
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "reservations" },
          () => router.refresh(),
        )
        .subscribe();
    })();

    return () => {
      vivant = false;
      void supabase.removeChannel(canal);
    };
  }, [router, signaler]);

  // --------------------------------------------------------------- sondage
  useEffect(() => {
    let minuteur: ReturnType<typeof setInterval> | null = null;

    async function demander() {
      if (document.visibilityState !== "visible") return;
      const reponse = await reservationsDepuis(depuis.current);
      if (reponse.ok && reponse.reservations.length > 0) signaler(reponse.reservations);
    }

    function relancer() {
      if (minuteur) clearInterval(minuteur);
      if (document.visibilityState !== "visible") return;
      // Un retour d'arrière-plan est le moment le plus probable d'avoir raté
      // quelque chose : on demande tout de suite, puis on reprend le rythme.
      void demander();
      minuteur = setInterval(demander, SONDAGE_MS);
    }

    relancer();
    document.addEventListener("visibilitychange", relancer);
    return () => {
      if (minuteur) clearInterval(minuteur);
      document.removeEventListener("visibilitychange", relancer);
    };
  }, [signaler]);

  if (nouvelles.length === 0) return null;

  const derniere = nouvelles[0];

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-3 bottom-3 z-50 animate-[monte_240ms_ease-out] rounded-2xl border border-gold/50 bg-noir-soft/95 p-4 shadow-[0_10px_40px_rgba(0,0,0,0.6)] backdrop-blur"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[0.7rem] uppercase tracking-[0.2em] text-gold">
            {nouvelles.length === 1
              ? "Nouvelle demande"
              : `${nouvelles.length} nouvelles demandes`}
          </p>
          <p className="mt-1 truncate text-sm text-cream">
            {derniere.nom} — {formatDateCourte(derniere.date)} à{" "}
            {minutesVersHeure(derniere.heure_minutes)}
          </p>
          <p className="truncate text-xs font-light text-white/45">
            {derniere.prestations_nom.join(" · ")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setNouvelles([])}
          aria-label="Masquer"
          className="press shrink-0 rounded-full border border-white/15 px-2.5 py-1 text-xs text-white/50"
        >
          ✕
        </button>
      </div>

      <Link
        href="/admin/reservations?vue=a-confirmer"
        onClick={() => setNouvelles([])}
        className="press gold-gradient mt-3 block rounded-full py-2.5 text-center text-sm text-noir"
      >
        Voir les demandes
      </Link>
    </div>
  );
}

/**
 * Un son court, synthétisé.
 *
 * Pas de fichier à charger, donc rien qui traîne au premier rendez-vous de la
 * journée. Les navigateurs interdisent le son tant que rien n'a été touché sur
 * la page : l'échec est normal et silencieux — le bandeau, lui, s'affiche
 * toujours.
 */
function sonner() {
  try {
    const Contexte =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Contexte) return;

    const contexte = new Contexte();
    const oscillateur = contexte.createOscillator();
    const volume = contexte.createGain();

    oscillateur.type = "sine";
    oscillateur.frequency.setValueAtTime(880, contexte.currentTime);
    oscillateur.frequency.setValueAtTime(1320, contexte.currentTime + 0.12);

    volume.gain.setValueAtTime(0.0001, contexte.currentTime);
    volume.gain.exponentialRampToValueAtTime(0.18, contexte.currentTime + 0.02);
    volume.gain.exponentialRampToValueAtTime(0.0001, contexte.currentTime + 0.35);

    oscillateur.connect(volume).connect(contexte.destination);
    oscillateur.start();
    oscillateur.stop(contexte.currentTime + 0.36);
    oscillateur.onended = () => void contexte.close();
  } catch {
    // Son refusé par le navigateur : ce n'est pas une panne.
  }
}
