# Vitesse d'affichage

Le site est rapide à rendre — quelques dizaines de millisecondes — mais chaque
page se peint après avoir parlé à Supabase. C'est ce dialogue, pas le rendu,
qui décide de la vitesse ressentie. Quatre décisions le tiennent court.

## Un seul aller-retour, pas six

La première version lisait six tables par navigation : réglages, catégories,
prestations, produits, galerie, contenus. Six requêtes vers Francfort avant de
pouvoir afficher quoi que ce soit. Depuis la Tunisie, avec une fonction Vercel
hébergée de l'autre côté de l'Atlantique, cela se comptait en secondes.

`donnees_publiques()` renvoie le tout d'un bloc, environ 7 ko de JSON. Un
aller-retour au lieu de six.

## Le résultat est mis en cache

Ces données sont **identiques pour toutes les visiteuses** et changent
rarement : rien de personnel n'y transite, un cache partagé est donc sans
danger. `unstable_cache` le garde côté serveur pendant une heure, sous
l'étiquette `site`.

Conséquence : une page visitée alors que le cache est chaud ne parle pas du
tout à Supabase. Zéro aller-retour.

L'heure n'est qu'un filet de sécurité. Toute écriture du panneau appelle
`updateTag("site")` : l'administratrice voit sa correction dès la page
suivante, sans attendre l'expiration.

Un échec n'est jamais mis en cache — le `try` est à l'extérieur de la fonction
cachée. Une coupure passagère de Supabase ne se retrouve donc pas figée en
« site de repli » pour une heure.

## La session n'est vérifiée que s'il y en a une

`@supabase/ssr` range la session dans un cookie `sb-<projet>-auth-token`. Une
visiteuse n'en a aucun, et c'est l'écrasante majorité du trafic.

`proxy.ts` et `adminConnecte()` regardent d'abord si ce cookie existe — une
lecture locale, sans réseau. S'il est absent, aucun client Supabase n'est
construit et aucune requête d'authentification n'est envoyée. Avant, chaque
page en payait une.

## Vercel doit tourner à Francfort

**À régler à la main, une fois** : Vercel → Settings → Functions → Function
Region → `fra1` (Frankfurt), la région du projet Supabase (`eu-central-1`).
Sans cela, Vercel choisit sa région par défaut — souvent Washington — et
chaque requête à la base traverse l'Atlantique deux fois. Le trajet le plus
rapide reste celui qu'on ne fait pas ; quand il faut le faire, autant qu'il
soit court.

Ce réglage vivait un temps dans un `vercel.json`, mais la clé `regions` n'est
pas acceptée sur tous les plans et faisait échouer le déploiement. Le tableau
de bord fonctionne partout.

## Une base qui ne répond pas n'est pas une base qui refuse

Une panne réseau renvoie une erreur : le code la rattrape et sert le catalogue
de repli. Une base **surchargée ou en train de redémarrer** ne renvoie rien du
tout — elle fait attendre. Sans plafond, le rendu reste suspendu, et Next
abandonne la page au bout de soixante secondes. Un redémarrage de Supabase de
quelques minutes suffisait alors à faire échouer un déploiement entier.

Chaque appel porte donc un délai (`src/lib/supabase/config.ts`) :

| Appel | Délai | Pourquoi |
| --- | --- | --- |
| lectures publiques | 6 s | au-delà, le catalogue de repli vaut mieux qu'une page qui ne vient pas |
| session, panneau | 8 s | l'administratrice préfère un refus net à un écran figé |
| écritures (réserver, commander) | 15 s | abandonner une écriture qui a peut-être abouti laisserait la cliente devant une erreur et le salon avec un rendez-vous — on attend plus longtemps avant de renoncer |

Vérifié en pointant le site vers un serveur qui accepte la connexion puis se
tait : la page d'accueil répond en 6,2 s avec son contenu de repli, là où elle
attendait indéfiniment auparavant.

## Le build ne dépend plus de la base

Les pages publiques portent `export const dynamic = "force-dynamic"`. Next ne
tente plus de les pré-rendre pendant le build, donc **aucun appel à Supabase
n'est fait au moment de construire le site** — vérifiable dans le journal de
build, qui ne contient plus une seule ligne `[cylia]`.

Rien n'est perdu : ces pages étaient déjà rendues à la demande, et leur vitesse
vient du cache de `chargerDonnees()`, pas du pré-rendu. Ce qui est gagné, c'est
qu'une base indisponible ne peut plus empêcher de déployer — au pire, le site
déployé s'affiche en mode repli le temps que la base revienne.

## Ce qui n'est pas mis en cache, et pourquoi

| Lecture | Cache | Raison |
| --- | --- | --- |
| catalogue, contenu, réglages | 1 h + étiquette | identiques pour tout le monde |
| occupation d'un jour (`occupation_du_jour`) | aucun | change d'une minute à l'autre ; une grille périmée ferait réserver un créneau déjà pris |
| écrans du panneau | aucun | le salon doit voir l'état réel, à la seconde |
| session de l'administratrice | aucun | c'est une vérification, pas une donnée |

## Si c'est encore lent

Dans l'ordre :

1. Les variables d'environnement sont-elles déclarées sur Vercel ? Sans elles
   le site sert son catalogue de repli — rapide, mais faux.
2. La région des fonctions est-elle bien `fra1` ? Vercel → Settings →
   Functions.
3. Le projet Supabase est-il en veille ? Un projet gratuit s'endort après une
   semaine sans requête, et le premier appel qui le réveille prend plusieurs
   secondes.
