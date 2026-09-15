"use client";

import { useEffect, useState } from "react";
import {
  enregistrerAbonnement,
  envoyerNotificationTest,
  supprimerAbonnement,
} from "@/app/actions/notifications";

const CLE_PUBLIQUE = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

/**
 * La clé VAPID voyage en base64 « URL » ; `pushManager` veut des octets.
 *
 * Le tampon est construit explicitement : `Uint8Array` peut s'adosser à une
 * mémoire partagée, que `subscribe()` refuse au typage.
 */
function versOctets(base64: string): Uint8Array<ArrayBuffer> {
  const complet = (base64 + "=".repeat((4 - (base64.length % 4)) % 4))
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const brut = window.atob(complet);
  const octets = new Uint8Array(new ArrayBuffer(brut.length));
  for (let i = 0; i < brut.length; i += 1) octets[i] = brut.charCodeAt(i);
  return octets;
}

type Etat =
  | "chargement"
  | "impossible"
  | "a-installer"
  | "refuse"
  | "inactif"
  | "actif";

/**
 * Alertes sur le téléphone du salon.
 *
 * Le panneau ne prévenait de rien : il fallait penser à l'ouvrir. Une
 * notification web arrive application fermée, comme celle d'une messagerie,
 * gratuitement et sans compte d'entreprise. Sur iPhone, une seule condition —
 * le panneau doit avoir été ajouté à l'écran d'accueil ; Apple refuse les
 * notifications à un site ouvert dans Safari.
 */
export default function AlertesPush() {
  const [etat, setEtat] = useState<Etat>("chargement");
  const [message, setMessage] = useState<string | null>(null);
  const [occupe, setOccupe] = useState(false);

  useEffect(() => {
    let vivant = true;
    // `etatActuel` est asynchrone de bout en bout : aucun `setEtat` ne part
    // pendant le corps de l'effet, seulement une fois la réponse connue.
    etatActuel().then((trouve) => {
      if (vivant) setEtat(trouve);
    });
    return () => {
      vivant = false;
    };
  }, []);

  async function activer() {
    setOccupe(true);
    setMessage(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setEtat("refuse");
        return;
      }

      const inscription = await navigator.serviceWorker.ready;
      const abonnement = await inscription.pushManager.subscribe({
        // Exigé par les navigateurs : un push doit toujours donner lieu à une
        // bulle visible. Pas de suivi silencieux.
        userVisibleOnly: true,
        applicationServerKey: versOctets(CLE_PUBLIQUE),
      });

      const brut = abonnement.toJSON();
      const reponse = await enregistrerAbonnement(
        {
          endpoint: abonnement.endpoint,
          keys: { p256dh: brut.keys?.p256dh ?? "", auth: brut.keys?.auth ?? "" },
        },
        navigator.userAgent,
      );

      if (!reponse.ok) {
        await abonnement.unsubscribe();
        setMessage(reponse.message);
        return;
      }
      setEtat("actif");
      setMessage("Cet appareil recevra les nouvelles demandes.");
    } catch (erreur) {
      console.error("[cylia] activation des alertes :", erreur);
      setMessage("L'activation a échoué sur cet appareil.");
    } finally {
      setOccupe(false);
    }
  }

  async function desactiver() {
    setOccupe(true);
    setMessage(null);
    try {
      const inscription = await navigator.serviceWorker.ready;
      const abonnement = await inscription.pushManager.getSubscription();
      if (abonnement) {
        await supprimerAbonnement(abonnement.endpoint);
        await abonnement.unsubscribe();
      }
      setEtat("inactif");
      setMessage("Cet appareil ne recevra plus d'alerte.");
    } finally {
      setOccupe(false);
    }
  }

  async function essayer() {
    setOccupe(true);
    setMessage(null);
    const reponse = await envoyerNotificationTest();
    setMessage(reponse.ok ? "Essai envoyé." : reponse.message);
    setOccupe(false);
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <h2 className="font-serif text-lg font-light text-cream">
        Alertes sur ce téléphone
      </h2>
      <p className="mt-1 text-xs font-light leading-relaxed text-white/50">
        Une bulle à chaque nouvelle demande de rendez-vous, même panneau fermé.
        À activer sur chaque appareil qui doit être prévenu.
      </p>

      <div className="mt-4">
        {etat === "chargement" && (
          <p className="text-sm font-light text-white/40">Vérification…</p>
        )}

        {etat === "impossible" && (
          <p className="text-sm font-light text-white/50">
            Ce navigateur ne sait pas recevoir de notifications, ou le serveur
            n&apos;a pas encore ses clés d&apos;envoi.
          </p>
        )}

        {etat === "a-installer" && (
          <p className="text-sm font-light leading-relaxed text-white/60">
            Sur iPhone, ajoutez d&apos;abord CYLIA à l&apos;écran d&apos;accueil&nbsp;:
            touchez <span className="text-gold">Partager</span> puis{" "}
            <span className="text-gold">Sur l&apos;écran d&apos;accueil</span>. Rouvrez
            ensuite le panneau depuis cette icône.
          </p>
        )}

        {etat === "refuse" && (
          <p className="text-sm font-light leading-relaxed text-white/60">
            Les notifications ont été refusées pour ce site. Elles se
            réautorisent dans les réglages du navigateur, à la ligne CYLIA.
          </p>
        )}

        {etat === "inactif" && (
          <button
            type="button"
            onClick={activer}
            disabled={occupe}
            className="press gold-gradient rounded-full px-5 py-2.5 text-sm text-noir disabled:opacity-50"
          >
            {occupe ? "Activation…" : "Activer les alertes"}
          </button>
        )}

        {etat === "actif" && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-emerald-400/40 px-3 py-1.5 text-xs text-emerald-300">
              Alertes actives
            </span>
            <button
              type="button"
              onClick={essayer}
              disabled={occupe}
              className="press rounded-full border border-gold/35 px-4 py-2 text-xs text-gold disabled:opacity-50"
            >
              Envoyer un essai
            </button>
            <button
              type="button"
              onClick={desactiver}
              disabled={occupe}
              className="press rounded-full border border-white/15 px-4 py-2 text-xs text-white/55 disabled:opacity-50"
            >
              Désactiver
            </button>
          </div>
        )}
      </div>

      {message && (
        <p role="status" className="mt-3 text-xs font-light text-white/55">
          {message}
        </p>
      )}
    </section>
  );
}

/**
 * Où en est cet appareil ? Lu une fois au montage.
 *
 * Volontairement hors du composant et sans `setState` : l'état n'est posé
 * qu'une seule fois, par l'appelant, quand la réponse est connue.
 */
async function etatActuel(): Promise<Etat> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !CLE_PUBLIQUE) {
    return "impossible";
  }

  // iOS n'accorde les notifications qu'à une application installée. Le dire
  // avant de demander la permission évite un refus définitif : une fois
  // refusée, elle ne se redemande pas, elle se rouvre dans les réglages.
  const surIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const installee =
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && Boolean((navigator as { standalone?: boolean }).standalone));
  if (surIOS && !installee) return "a-installer";

  try {
    const inscription = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
      updateViaCache: "none",
    });
    if (await inscription.pushManager.getSubscription()) return "actif";
    return Notification.permission === "denied" ? "refuse" : "inactif";
  } catch (erreur) {
    console.error("[cylia] agent de service :", erreur);
    return "impossible";
  }
}
