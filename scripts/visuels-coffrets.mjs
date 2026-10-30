#!/usr/bin/env node
/**
 * Fabrique la photo de groupe de chaque coffret — `npm run visuels:coffrets`.
 *
 * Les packshots du catalogue sont des flacons détourés posés au milieu d'un
 * grand carré transparent : le flacon n'en occupe souvent qu'un quart. Côte à
 * côte dans une mosaïque, chacun dans sa case, ils devenaient minuscules. Ici,
 * chaque packshot est d'abord rogné à son contour, puis les flacons sont
 * rangés ensemble, légèrement chevauchés, sur une même ligne de sol — une
 * vraie « photo de groupe » où le coffret remplit sa vignette.
 *
 * Les images sont écrites dans `public/visuels-coffrets/` (nom haché : un
 * visuel refait est une nouvelle adresse, que le cache d'un an de
 * l'optimiseur ne peut pas confondre avec l'ancienne), et leur liste dans
 * `src/lib/visuels-coffrets.ts`. Chaque entrée retient les photos dont elle a
 * été faite : un coffret recomposé depuis le panneau ne correspond plus, et
 * le site revient à l'assemblage dessiné en CSS tant que ce script n'a pas été
 * relancé. Une photo du coffret déposée dans le panneau passe toujours avant.
 *
 * Lit le catalogue public (`donnees_publiques`) avec la clé publiable :
 * `.env.local`, sinon `.env.example`.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const RACINE = join(dirname(fileURLToPath(import.meta.url)), "..");
const DOSSIER = join(RACINE, "public", "visuels-coffrets");
const LISTE = join(RACINE, "src", "lib", "visuels-coffrets.ts");

/** Côté du carré produit. La plus grande vignette (fiche, 100vw) tient dedans. */
const COTE = 1000;
/** Hauteur visée du flacon central, en part du carré. */
const HAUTEUR_CENTRE = 0.9;
const HAUTEUR_COTE = 0.8;
/** Largeur maximale d'un flacon — un tube couché ne mange pas toute la photo. */
const LARGEUR_MAX = 0.62;
/** Largeur maximale du groupe entier. */
const LARGEUR_GROUPE = 0.96;
/** Chevauchement de deux flacons voisins, en part du plus étroit des deux. */
const CHEVAUCHEMENT = 0.2;
/** La ligne de sol, au plus bas. */
const SOL = 0.95;
const MAX_FLACONS = 4;

function lireEnv() {
  const fichier = [".env.local", ".env.example"]
    .map((nom) => join(RACINE, nom))
    .find((chemin) => existsSync(chemin));
  const valeurs = { ...process.env };
  if (fichier) {
    for (const ligne of readFileSync(fichier, "utf8").split("\n")) {
      const m = ligne.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !valeurs[m[1]]) valeurs[m[1]] = m[2];
    }
  }
  const url = valeurs.NEXT_PUBLIC_SUPABASE_URL;
  const cle = valeurs.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !cle) throw new Error("NEXT_PUBLIC_SUPABASE_URL / _PUBLISHABLE_KEY absents");
  return { url, cle };
}

async function chargerCatalogue() {
  const { url, cle } = lireEnv();
  const reponse = await fetch(`${url}/rest/v1/rpc/donnees_publiques`, {
    method: "POST",
    headers: { apikey: cle, "Content-Type": "application/json" },
    body: "{}",
  });
  if (!reponse.ok) throw new Error(`donnees_publiques : HTTP ${reponse.status}`);
  return reponse.json();
}

/** Proche du blanc : le fond d'un packshot qui n'a pas été détouré. */
const BLANC = 238;
/** En dessous de cette opacité, un pixel compte comme vide (halo, ombre très légère). */
const OPACITE_MIN = 28;

/**
 * Le packshot rogné à son contour.
 *
 * La plupart sont détourés, mais quelques-uns portent encore un fond blanc
 * opaque, qui ferait un rectangle blanc au milieu du groupe. Le fond est donc
 * effacé par remplissage depuis les bords — et seulement depuis les bords : le
 * corps blanc d'un flacon, séparé du fond par son contour, reste intact.
 */
async function flaconRogne(url) {
  const reponse = await fetch(url);
  if (!reponse.ok) throw new Error(`${url} : HTTP ${reponse.status}`);
  const brut = Buffer.from(await reponse.arrayBuffer());
  const { data, info } = await sharp(brut).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: L, height: H } = info;

  const vide = (p) =>
    data[p * 4 + 3] < OPACITE_MIN ||
    (data[p * 4] >= BLANC && data[p * 4 + 1] >= BLANC && data[p * 4 + 2] >= BLANC);

  const vu = new Uint8Array(L * H);
  const pile = [];
  for (let x = 0; x < L; x++) pile.push(x, (H - 1) * L + x);
  for (let y = 0; y < H; y++) pile.push(y * L, y * L + L - 1);
  while (pile.length) {
    const p = pile.pop();
    if (vu[p] || !vide(p)) continue;
    vu[p] = 1;
    data[p * 4 + 3] = 0;
    const x = p % L;
    if (x > 0) pile.push(p - 1);
    if (x < L - 1) pile.push(p + 1);
    if (p >= L) pile.push(p - L);
    if (p < L * (H - 1)) pile.push(p + L);
  }

  let gauche = L, droite = -1, haut = H, bas = -1;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < L; x++) {
      if (data[(y * L + x) * 4 + 3] < OPACITE_MIN) continue;
      if (x < gauche) gauche = x;
      if (x > droite) droite = x;
      if (y < haut) haut = y;
      if (y > bas) bas = y;
    }
  }
  if (droite < 0) throw new Error(`${url} : image vide`);

  const largeur = droite - gauche + 1;
  const hauteur = bas - haut + 1;
  const image = await sharp(data, { raw: { width: L, height: H, channels: 4 } })
    .extract({ left: gauche, top: haut, width: largeur, height: hauteur })
    .png()
    .toBuffer();
  return { image, largeur, hauteur };
}

/**
 * Range les flacons : le ou les flacons du milieu un peu plus grands et devant,
 * les autres derrière, tous sur la même ligne de sol.
 */
function disposer(flacons) {
  const n = flacons.length;
  const milieu = (n - 1) / 2;
  const auCentre = (i) => Math.abs(i - milieu) < 0.6;

  const boites = flacons.map((f, i) => {
    let h = (auCentre(i) || n <= 2 ? HAUTEUR_CENTRE : HAUTEUR_COTE) * COTE;
    let w = (h * f.largeur) / f.hauteur;
    if (w > LARGEUR_MAX * COTE) {
      w = LARGEUR_MAX * COTE;
      h = (w * f.hauteur) / f.largeur;
    }
    return { ...f, i, w, h };
  });

  const recouvre = (i) => CHEVAUCHEMENT * Math.min(boites[i].w, boites[i + 1].w);
  const total =
    boites.reduce((t, b) => t + b.w, 0) -
    boites.slice(0, -1).reduce((t, _, i) => t + recouvre(i), 0);
  const facteur = Math.min(1, (LARGEUR_GROUPE * COTE) / total);

  const largeurGroupe = total * facteur;
  let x = (COTE - largeurGroupe) / 2;
  boites.forEach((b, i) => {
    const decalage = i < n - 1 ? b.w - recouvre(i) : 0;
    b.w *= facteur;
    b.h *= facteur;
    b.x = Math.round(x);
    x += decalage * facteur;
  });

  // Un groupe large, donc moins haut, se centre dans le carré plutôt que de
  // laisser tout le vide au-dessus de lui.
  const hauteurMax = Math.max(...boites.map((b) => b.h));
  const sol = Math.min(SOL * COTE, (COTE + hauteurMax) / 2 + 0.03 * COTE);
  for (const b of boites) b.y = Math.round(sol - b.h);

  // Du bord vers le centre : le flacon du milieu est posé en dernier, devant.
  const ordre = [...boites].sort((a, b) => Math.abs(b.i - milieu) - Math.abs(a.i - milieu));
  return { ordre, largeurGroupe, hauteurMax, sol };
}

async function composer(photos) {
  const flacons = await Promise.all(photos.slice(0, MAX_FLACONS).map(flaconRogne));
  const { ordre, largeurGroupe, hauteurMax, sol } = disposer(flacons);

  const calques = await Promise.all(
    ordre.map(async (b) => ({
      input: await sharp(b.image)
        .resize(Math.round(b.w), Math.round(b.h), { fit: "fill" })
        .png()
        .toBuffer(),
      left: b.x,
      top: b.y,
    })),
  );

  // Une ombre douce au sol : sans elle, les flacons ont l'air de flotter.
  const ombre = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${COTE}" height="${COTE}">
      <defs><filter id="f" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="${COTE * 0.012}"/></filter></defs>
      <ellipse cx="${COTE / 2}" cy="${sol}" rx="${(largeurGroupe / 2) * 0.92}"
        ry="${COTE * 0.018}" fill="#3b2a12" fill-opacity="0.16" filter="url(#f)"/>
    </svg>`,
  );

  const image = await sharp({
    create: { width: COTE, height: COTE, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: ombre, left: 0, top: 0 }, ...calques])
    .webp({ quality: 82, alphaQuality: 90, effort: 6 })
    .toBuffer();

  return {
    image,
    remplissage: { largeur: largeurGroupe / COTE, hauteur: hauteurMax / COTE },
  };
}

/** Mêmes photos que `visuelsDuCoffret` les lirait, sans la photo du coffret. */
function photosDesProduits(coffret, parId) {
  return (coffret.produit_ids ?? [])
    .map((id) => parId.get(id)?.image_url)
    .filter(Boolean);
}

async function main() {
  const { coffrets = [], produits = [] } = await chargerCatalogue();
  const parId = new Map(produits.map((p) => [p.id, p]));

  rmSync(DOSSIER, { recursive: true, force: true });
  mkdirSync(DOSSIER, { recursive: true });

  const entrees = [];
  for (const coffret of coffrets) {
    const sources = photosDesProduits(coffret, parId);
    if (sources.length < 2) {
      console.log(`– ${coffret.nom} : moins de deux photos, rien à assembler`);
      continue;
    }
    const { image, remplissage } = await composer(sources);
    const hache = createHash("sha1").update(image).digest("hex").slice(0, 10);
    const nom = `${coffret.id}-${hache}.webp`;
    writeFileSync(join(DOSSIER, nom), image);
    entrees.push({ id: coffret.id, nom: coffret.nom, src: `/visuels-coffrets/${nom}`, sources });
    console.log(
      `✓ ${coffret.nom.padEnd(22)} ${Math.round(image.length / 1024)} Ko · ` +
        `largeur ${Math.round(remplissage.largeur * 100)} % · hauteur ${Math.round(remplissage.hauteur * 100)} %`,
    );
  }

  const corps = entrees
    .map(
      (e) =>
        `  // ${e.nom}\n  ${JSON.stringify(e.id)}: {\n    src: ${JSON.stringify(e.src)},\n` +
        `    sources: [\n${e.sources.map((s) => `      ${JSON.stringify(s)},`).join("\n")}\n    ],\n  },`,
    )
    .join("\n");

  writeFileSync(
    LISTE,
    `/**
 * Photos de groupe des coffrets, fabriquées par \`scripts/visuels-coffrets.mjs\`
 * à partir des packshots de leurs produits. Fichier généré : relancer
 * \`npm run visuels:coffrets\` plutôt que de le modifier à la main.
 *
 * \`sources\` : les photos dont le visuel a été fait, dans l'ordre. Si le
 * coffret ne les a plus, le visuel est ignoré — voir \`visuelsDuCoffret\`.
 */
export const VISUELS_COFFRETS: Record<string, { src: string; sources: readonly string[] }> = {
${corps}
};
`,
  );

  console.log(`\n${entrees.length} visuels → public/visuels-coffrets/ (${readdirSync(DOSSIER).length} fichiers)`);
}

main().catch((erreur) => {
  console.error(erreur);
  process.exit(1);
});
