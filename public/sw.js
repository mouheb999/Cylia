/*
 * Agent de service de CYLIA.
 *
 * Il fait trois choses, et volontairement pas une de plus :
 *
 *  1. il reçoit les notifications du salon, application fermée ;
 *  2. il ouvre le bon écran quand on touche la bulle ;
 *  3. il montre une page « hors ligne » plutôt que le dinosaure du navigateur.
 *
 * Ce qu'il ne fait pas : mettre le site en cache. Les prix, les créneaux et le
 * planning changent d'une minute à l'autre — resservir une version gardée en
 * mémoire ferait réserver un créneau déjà pris. Seule la page hors ligne, qui
 * ne dit rien d'autre que « pas de réseau », est gardée.
 */

const CACHE = "cylia-v1";
const HORS_LIGNE = "/hors-ligne";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.add(new Request(HORS_LIGNE, { cache: "reload" })))
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cles) =>
        Promise.all(cles.filter((cle) => cle !== CACHE).map((cle) => caches.delete(cle))),
      )
      .then(() => self.clients.claim()),
  );
});

/*
 * Réseau d'abord, toujours. Le cache n'intervient que lorsque le réseau a
 * échoué sur une navigation — et il ne contient que la page hors ligne.
 */
self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;

  event.respondWith(
    fetch(event.request).catch(() =>
      caches
        .match(HORS_LIGNE)
        .then(
          (reponse) =>
            reponse ??
            new Response("Hors ligne", {
              status: 503,
              headers: { "Content-Type": "text/plain; charset=utf-8" },
            }),
        ),
    ),
  );
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let charge;
  try {
    charge = event.data.json();
  } catch {
    charge = { titre: "CYLIA", corps: event.data.text(), url: "/admin", tag: "cylia" };
  }

  event.waitUntil(
    self.registration.showNotification(charge.titre ?? "CYLIA", {
      body: charge.corps ?? "",
      icon: "/icone-192.png",
      badge: "/badge.png",
      tag: charge.tag ?? "cylia",
      // Sans cela, une deuxième demande remplacerait la première en silence :
      // le salon verrait la bulle changer sans jamais être prévenu.
      renotify: true,
      requireInteraction: true,
      vibrate: [120, 60, 120],
      data: { url: charge.url ?? "/admin/reservations" },
    }),
  );
});

/*
 * Un onglet du panneau déjà ouvert est ramené au premier plan plutôt que
 * doublé : le salon travaille sur un téléphone, pas sur douze fenêtres.
 */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const cible = new URL(event.notification.data?.url ?? "/admin", self.location.origin).href;

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((fenetres) => {
        for (const fenetre of fenetres) {
          if (fenetre.url.startsWith(self.location.origin) && "focus" in fenetre) {
            fenetre.focus();
            if ("navigate" in fenetre) return fenetre.navigate(cible);
            return undefined;
          }
        }
        return self.clients.openWindow(cible);
      }),
  );
});
