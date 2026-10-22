import "server-only";
import { createHash } from "node:crypto";
import { numeroInternational } from "@/lib/telephone";
import {
  ID_PIXEL,
  type EvenementMeta,
  type ParametresMeta,
  type UtilisateurMeta,
} from "./track";

/**
 * L'API Conversions de Meta, côté serveur.
 *
 * Le pendant du pixel : le même évènement, envoyé de serveur à serveur, que
 * ni un bloqueur de publicité ni Safari ne peuvent intercepter. Meta le
 * rapproche de celui du navigateur grâce à `event_id`.
 *
 * Le jeton reste ici : `META_CAPI_TOKEN` n'est jamais préfixé `NEXT_PUBLIC_`,
 * et ce module ne peut pas être importé depuis le navigateur.
 */

/** Dernière version de l'API Graph au moment de l'écriture (juillet 2026). */
const VERSION_GRAPH = "v26.0";

const DELAI_MS = 5000;

/** Ce que la requête de la cliente dit d'elle — de quoi la reconnaître. */
export type ContexteNavigateur = {
  ip: string | null;
  userAgent: string | null;
  fbp: string | null;
  fbc: string | null;
};

export type EvenementServeur = {
  event: EvenementMeta;
  eventId: string;
  params: ParametresMeta;
  url: string | null;
  user?: UtilisateurMeta;
  navigateur: ContexteNavigateur;
};

export type ReponseCapi = { ok: true } | { ok: false; status: number; message: string };

function hacher(valeur: string): string {
  return createHash("sha256").update(valeur).digest("hex");
}

/** Haché si non vide, absent sinon : Meta refuse un champ haché vide. */
function hacherSi(valeur: string | null | undefined): string | undefined {
  return valeur ? hacher(valeur) : undefined;
}

function normaliser(valeur: string | undefined): string | undefined {
  const propre = valeur?.trim().toLowerCase();
  return propre || undefined;
}

/**
 * Téléphone au format attendu par Meta : chiffres seuls, indicatif compris.
 * « 54 395 168 », « +216 54 395 168 » et « 0021654395168 » donnent tous
 * « 21654395168 » — voir `numeroInternational`.
 */
function normaliserTelephone(valeur: string | undefined): string | undefined {
  return valeur ? (numeroInternational(valeur) ?? undefined) : undefined;
}

/**
 * Premier en-tête `x-forwarded-for` : l'adresse de la cliente, posée par
 * Vercel devant les éventuels relais.
 */
export function adresseIp(entetes: Headers): string | null {
  const relayee = entetes.get("x-forwarded-for")?.split(",")[0]?.trim();
  return relayee || entetes.get("x-real-ip") || null;
}

/**
 * `_fbc` d'après le `fbclid` de l'adresse, quand le cookie manque.
 *
 * Le pixel pose ce cookie lui-même à l'arrivée depuis une publicité — mais pas
 * s'il est bloqué. Le reconstruire ici garde le lien avec le clic payé.
 */
function fbcDepuisAdresse(url: string | null): string | null {
  if (!url) return null;
  try {
    const fbclid = new URL(url).searchParams.get("fbclid");
    return fbclid ? `fb.1.${Date.now()}.${fbclid}` : null;
  } catch {
    return null;
  }
}

/** Le nom saisi d'un bloc : « Amira Ben Salah » → Amira / Ben Salah. */
export function decouperNom(nom: string): { firstName?: string; lastName?: string } {
  const [prenom, ...reste] = nom.trim().split(/\s+/);
  return { firstName: prenom || undefined, lastName: reste.join(" ") || undefined };
}

/** Envoie un évènement à Meta. Ne lève jamais ; journalise les refus. */
export async function envoyerEvenementMeta(evenement: EvenementServeur): Promise<ReponseCapi> {
  const jeton = process.env.META_CAPI_TOKEN;
  if (!jeton) {
    return { ok: false, status: 503, message: "META_CAPI_TOKEN absent" };
  }

  const { navigateur, user } = evenement;
  const villeNormalisee = normaliser(user?.city)?.replace(/\s+/g, "");

  const userData = {
    client_ip_address: navigateur.ip ?? undefined,
    client_user_agent: navigateur.userAgent ?? undefined,
    fbp: navigateur.fbp ?? undefined,
    fbc: navigateur.fbc ?? fbcDepuisAdresse(evenement.url) ?? undefined,
    ph: hacherSi(normaliserTelephone(user?.phone)),
    em: hacherSi(normaliser(user?.email)),
    fn: hacherSi(normaliser(user?.firstName)),
    ln: hacherSi(normaliser(user?.lastName)),
    ct: hacherSi(villeNormalisee),
    // La boutique ne livre qu'en Tunisie.
    country: hacher("tn"),
  };

  const testEventCode = process.env.META_TEST_EVENT_CODE;
  const charge = {
    data: [
      {
        event_name: evenement.event,
        event_time: Math.floor(Date.now() / 1000),
        event_id: evenement.eventId,
        action_source: "website",
        event_source_url: evenement.url ?? undefined,
        user_data: userData,
        custom_data: evenement.params,
      },
    ],
    ...(testEventCode ? { test_event_code: testEventCode } : {}),
    access_token: jeton,
  };

  try {
    const reponse = await fetch(
      `https://graph.facebook.com/${VERSION_GRAPH}/${ID_PIXEL}/events`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(charge),
        cache: "no-store",
        signal: AbortSignal.timeout(DELAI_MS),
      },
    );
    if (reponse.ok) return { ok: true };

    const corps = (await reponse.json().catch(() => null)) as {
      error?: { message?: string; code?: number; error_subcode?: number; fbtrace_id?: string };
    } | null;
    console.error("[cylia] meta capi :", evenement.event, reponse.status, corps?.error ?? corps);
    return { ok: false, status: 502, message: corps?.error?.message ?? `HTTP ${reponse.status}` };
  } catch (erreur) {
    console.error("[cylia] meta capi :", evenement.event, erreur);
    return { ok: false, status: 502, message: "Meta injoignable" };
  }
}
