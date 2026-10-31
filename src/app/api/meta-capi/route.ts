import { NextResponse, type NextRequest } from "next/server";
import { adresseIp, envoyerEvenementMeta } from "@/lib/meta/capi";
import {
  CATEGORIES_META,
  type EvenementMeta,
  type ParametresMeta,
  type UtilisateurMeta,
} from "@/lib/meta/track";

/**
 * Relais du navigateur vers l'API Conversions de Meta.
 *
 * `trackMeta` poste ici chaque évènement qu'il vient de donner au pixel, avec
 * le même `eventId` ; on y ajoute ce que seul le serveur voit (adresse IP,
 * cookies `_fbp`/`_fbc`) et on transmet à Meta avec le jeton, qui ne quitte
 * jamais le serveur.
 *
 * Boutique et rendez-vous passent ici de la même façon ; un évènement de
 * rendez-vous porte `content_category: "reservation"`.
 *
 * L'achat et le rendez-vous ne sont pas acceptés ici. Cette route est
 * publique : n'importe qui peut y poster ce qu'il veut, et un faux `Purchase`
 * ou un faux `Schedule` fausserait précisément ce sur quoi la campagne
 * s'optimise. Ils partent de `passerCommande` et de `confirmerReservation`,
 * une fois la commande ou le rendez-vous enregistré, avec les montants relus
 * en base.
 */

const ACCEPTES: readonly EvenementMeta[] = ["ViewContent", "AddToCart", "InitiateCheckout"];

const MAX_ARTICLES = 30;

function texte(valeur: unknown, max: number): string | undefined {
  return typeof valeur === "string" && valeur.length > 0 && valeur.length <= max
    ? valeur
    : undefined;
}

function nombre(valeur: unknown, min: number, max: number): number | undefined {
  return typeof valeur === "number" && Number.isFinite(valeur) && valeur >= min && valeur <= max
    ? valeur
    : undefined;
}

/** Les paramètres, reconstruits champ par champ : rien d'inattendu ne passe. */
function lireParametres(brut: unknown): ParametresMeta | null {
  if (typeof brut !== "object" || brut === null) return null;
  const p = brut as Record<string, unknown>;
  if (p.currency !== "USD" || p.content_type !== "product") return null;
  if (!Array.isArray(p.contents) || p.contents.length === 0 || p.contents.length > MAX_ARTICLES) {
    return null;
  }

  const contents: ParametresMeta["contents"] = [];
  for (const ligne of p.contents as unknown[]) {
    if (typeof ligne !== "object" || ligne === null) return null;
    const l = ligne as Record<string, unknown>;
    const id = texte(l.id, 64);
    const quantity = nombre(l.quantity, 1, 99);
    const item_price = nombre(l.item_price, 0, 100_000);
    if (!id || quantity === undefined || !Number.isInteger(quantity) || item_price === undefined) {
      return null;
    }
    contents.push({ id, quantity, item_price });
  }

  const value = nombre(p.value, 0, 1_000_000);
  if (value === undefined) return null;

  const categorie = CATEGORIES_META.find((c) => c === p.content_category);
  if (p.content_category !== undefined && !categorie) return null;

  return {
    content_ids: contents.map((c) => c.id),
    contents,
    content_name: texte(p.content_name, 500) ?? "",
    content_type: "product",
    ...(categorie ? { content_category: categorie } : {}),
    num_items: contents.reduce((t, c) => t + c.quantity, 0),
    value,
    currency: "USD",
  };
}

function lireUtilisateur(brut: unknown): UtilisateurMeta | undefined {
  if (typeof brut !== "object" || brut === null) return undefined;
  const u = brut as Record<string, unknown>;
  return {
    phone: texte(u.phone, 40),
    email: texte(u.email, 200),
    firstName: texte(u.firstName, 80),
    lastName: texte(u.lastName, 80),
    city: texte(u.city, 80),
  };
}

/** Seules les pages du site postent ici. */
function memeOrigine(requete: NextRequest): boolean {
  const origine = requete.headers.get("origin");
  if (!origine) return true;
  try {
    return new URL(origine).host === requete.headers.get("host");
  } catch {
    return false;
  }
}

export async function POST(requete: NextRequest) {
  if (!memeOrigine(requete)) {
    return NextResponse.json({ ok: false, erreur: "origine refusée" }, { status: 403 });
  }

  let corps: Record<string, unknown>;
  try {
    const brut = (await requete.json()) as unknown;
    if (typeof brut !== "object" || brut === null) throw new Error();
    corps = brut as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, erreur: "corps invalide" }, { status: 400 });
  }

  const evenement = ACCEPTES.find((e) => e === corps.event);
  const eventId = typeof corps.eventId === "string" && /^[\w-]{8,100}$/.test(corps.eventId)
    ? corps.eventId
    : undefined;
  const params = lireParametres(corps.params);
  if (!evenement || !eventId || !params) {
    return NextResponse.json({ ok: false, erreur: "évènement invalide" }, { status: 400 });
  }

  const url = texte(corps.url, 2000) ?? requete.headers.get("referer");

  const resultat = await envoyerEvenementMeta({
    event: evenement,
    eventId,
    params,
    url,
    user: lireUtilisateur(corps.user),
    navigateur: {
      ip: adresseIp(requete.headers),
      userAgent: requete.headers.get("user-agent"),
      fbp: requete.cookies.get("_fbp")?.value ?? null,
      fbc: requete.cookies.get("_fbc")?.value ?? null,
    },
  });

  if (!resultat.ok) {
    return NextResponse.json({ ok: false }, { status: resultat.status });
  }
  return NextResponse.json({ ok: true });
}
