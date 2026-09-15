# Être prévenu

Le panneau ne prévenait de rien. Il fallait penser à l'ouvrir — et une demande
arrivée à 21 h attendait le lendemain matin. C'est le manque que cette page
comble, sur trois plans qui ne se remplacent pas :

| Quand | Ce qui se passe | Où |
| --- | --- | --- |
| Le panneau est ouvert | La demande apparaît seule, un son court, un bandeau | `VeilleReservations` |
| Le panneau est fermé | Une bulle sur le téléphone | Web Push + agent de service |
| Rien n'a marché | Un sondage rattrape au retour | `reservationsDepuis` |

## Le panneau ouvert : temps réel

Supabase pousse l'insertion à toutes les sessions administratrices abonnées. Le
composant écoute, ajoute la demande à un bandeau en bas d'écran, joue un son
court et appelle `router.refresh()` — **c'est cette dernière ligne qui fait
apparaître le rendez-vous dans la liste sans que personne n'ait rechargé.**

Realtime respecte RLS : la policy de `reservations` n'ouvre la lecture qu'aux
administratrices, donc un abonnement anonyme ne reçoit rien. Encore faut-il que
le jeton soit transmis — d'où le `supabase.realtime.setAuth()` avant
l'abonnement. Sans lui, la connexion s'établit et ne délivre jamais rien : une
panne silencieuse, et la plus difficile à diagnostiquer.

Le son ne part qu'après un premier contact avec la page : les navigateurs
l'exigent. Le bandeau, lui, s'affiche toujours.

## Le panneau fermé : notifications web

Une notification web arrive comme celle d'une messagerie : application fermée,
téléphone en poche. Gratuitement, sans compte d'entreprise, sans WhatsApp
Business API.

Ce qu'il faut, une fois :

1. **Générer les clés VAPID** — elles prouvent que l'envoi vient bien de ce
   site, rien de plus :

   ```bash
   npx web-push generate-vapid-keys
   ```

2. **Déclarer trois variables** sur Vercel (Settings → Environment Variables,
   les trois environnements) :

   | Variable | Rôle |
   | --- | --- |
   | `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | part dans le navigateur, c'est son rôle |
   | `VAPID_PRIVATE_KEY` | reste sur le serveur, **jamais** préfixée `NEXT_PUBLIC_` |
   | `SUPABASE_SECRET_KEY` | lit la liste des appareils au moment d'envoyer |

3. **Jouer la migration `0017`** — elle crée `abonnements_push` et ouvre la
   publication Realtime.

4. **Installer le panneau** sur l'écran d'accueil du téléphone, puis
   `/admin/reglages` → **Activer les alertes**, sur chaque appareil à prévenir.

### Pourquoi une clé de service

L'envoi part au moment où une **cliente** réserve. À cet instant il n'y a pas de
session administratrice dans la requête — la cliente n'en a pas — et la liste
des appareils du salon n'est lisible que par une administratrice. Ni cookie ni
RLS ne peuvent servir de laissez-passer ici : c'est exactement le cas d'usage de
la clé de service, et son seul usage dans ce code (`lib/supabase/service.ts`).

Absente, rien ne casse : la notification ne part pas, le rendez-vous est
enregistré, le bandeau temps réel fonctionne toujours.

### Pourquoi l'installation est obligatoire sur iPhone

Apple n'accorde les notifications qu'aux sites ajoutés à l'écran d'accueil. Le
panneau le détecte et le dit avant de demander la permission — parce qu'une
permission refusée ne se redemande pas : elle se rouvre dans les réglages du
téléphone, ce que personne ne trouve.

### L'envoi ne fait jamais échouer une réservation

`after()` rend la main à la cliente dès que le rendez-vous est écrit ; la
notification part ensuite. Un service de push lent — ou en panne — n'allonge pas
le dernier écran du tunnel, et ne peut pas transformer un rendez-vous enregistré
en erreur affichée.

Les abonnements que le service de push déclare morts (404, 410) sont effacés au
passage : sans cela, la table se remplirait d'appareils qui n'existent plus.

## Le filet : le sondage

Realtime tient une connexion ouverte, et une connexion ouverte meurt en
silence : téléphone en veille, wifi qui bascule en 4G, tunnel coupé. Toutes les
45 secondes — onglet visible seulement — le panneau demande « quoi de neuf
depuis telle heure ? ». Au retour d'arrière-plan, il demande tout de suite :
c'est le moment le plus probable d'avoir manqué quelque chose.

C'est aussi le seul mécanisme qui fonctionne **tant que la migration 0017 n'a
pas été jouée**.

## Et WhatsApp ?

Envoyer une notification *par WhatsApp* au salon demande l'API WhatsApp
Business de Meta : un compte d'entreprise vérifié, un numéro dédié qui ne peut
plus servir dans l'application WhatsApp ordinaire, des modèles de message
approuvés un par un, et une facturation à la conversation. Pour prévenir trois
personnes qu'une cliente a réservé, la notification web fait le même travail,
gratuitement et en une soirée.

WhatsApp reste présent là où il est irremplaçable : **dans l'autre sens**. Le
panneau écrit à la cliente, message déjà rédigé, depuis le téléphone du salon —
voir [ADMINISTRATION.md](ADMINISTRATION.md#répondre-à-une-cliente).

## Vérifier que tout marche

- `/admin/reglages` → **Envoyer un essai**. La bulle part vers *tous* les
  appareils enregistrés, comme une vraie alerte : c'est le seul essai qui
  prouve quelque chose. Accepter la permission ne dit pas encore que le
  téléphone recevra quoi que ce soit.
- En local, les notifications exigent HTTPS : `next dev --experimental-https`.
- L'agent de service est servi sans cache (`next.config.ts`) : une correction
  poussée aujourd'hui est prise au prochain chargement, pas à l'expiration d'un
  cache.
