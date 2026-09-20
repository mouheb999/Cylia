-- Le pack a maintenant sa page, et le salon la remplit lui-même.
--
-- Jusqu'ici, toucher un pack sur l'accueil menait droit au tunnel de
-- réservation : la cliente quittait la formule qui l'avait arrêtée pour une
-- liste de prestations où elle ne la retrouvait pas. Ce qu'elle cherche à cet
-- instant, c'est le détail — les photos de la cabine, ce que le rituel
-- comprend, combien de temps il dure — et, seulement ensuite, le bouton qui
-- réserve. Elle passe donc par `/packs/<slug>`, où les autres formules
-- l'attendent aussi, juste en dessous.
--
-- Cinq colonnes portent cette page :
--
--   slug          l'adresse de la fiche, stable une fois posée ;
--   images        l'album de la fiche, couverture en tête, comme les groupes ;
--   inclusions    ce que le pack comprend, ligne à ligne ;
--   duree_minutes la durée annoncée — indicative, `null` quand on préfère taire ;
--   prestation_id la prestation que « Réserver ce pack » dépose dans le panier.
--
-- `prestation_id` est la charnière : les packs du salon existent déjà au
-- catalogue (pack-decouverte, pack-evasion…), avec leur durée et leur prix.
-- Plutôt que d'inventer un second circuit de réservation, la fiche renvoie au
-- tunnel avec la prestation déjà retenue — `/reserver?prestation=…`, que le
-- flux sait lire depuis les offres de l'accueil.

alter table packs
  add column if not exists slug          text,
  add column if not exists images        text[] not null default '{}',
  add column if not exists inclusions    text[] not null default '{}',
  add column if not exists duree_minutes int,
  add column if not exists prestation_id text references prestations (id) on delete set null;

alter table packs
  drop constraint if exists packs_duree_positive;
alter table packs
  add constraint packs_duree_positive
  check (duree_minutes is null or duree_minutes > 0);

-- ------------------------------------------------------------------ l'adresse

-- « Pack Hammam découverte » → « pack-hammam-decouverte ». Les accents sont
-- remplacés lettre à lettre : `unaccent` est une extension, et une extension
-- qui manque le jour de la migration casserait la table pour un tiret.
create or replace function texte_en_slug(texte text)
returns text
language sql
immutable
set search_path = public
as $$
  select btrim(
    regexp_replace(
      lower(translate(coalesce(texte, ''),
        'ÀÁÂÃÄÅàáâãäåÇçÈÉÊËèéêëÌÍÎÏìíîïÑñÒÓÔÕÖòóôõöÙÚÛÜùúûüÝýÿŒœÆæ',
        'AAAAAAaaaaaaCcEEEEeeeeIIIIiiiiNnOOOOOoooooUUUUuuuuYyyOoAa')),
      '[^a-z0-9]+', '-', 'g'),
    '-');
$$;

-- Le slug se pose tout seul quand personne ne le donne — le panneau, mais
-- aussi une ligne ajoutée à la main depuis Supabase. Il ne se recalcule
-- jamais : une fiche partagée garde son adresse même si le pack est renommé.
create or replace function packs_poser_slug()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  base      text;
  candidat  text;
  suffixe   int := 2;
begin
  if new.slug is null or btrim(new.slug) = '' then
    base := coalesce(nullif(left(texte_en_slug(new.nom), 60), ''), 'pack');
    candidat := base;
    while exists (select 1 from packs where slug = candidat and id <> new.id) loop
      candidat := base || '-' || suffixe;
      suffixe := suffixe + 1;
    end loop;
    new.slug := candidat;
  end if;
  return new;
end;
$$;

drop trigger if exists packs_slug on packs;
create trigger packs_slug
  before insert or update on packs
  for each row execute function packs_poser_slug();

-- Les packs déjà en base reçoivent le leur, numéroté si deux portent le même
-- nom — une adresse ne se partage pas.
with numerotes as (
  select id,
         texte_en_slug(nom) as base,
         row_number() over (
           partition by texte_en_slug(nom) order by ordre, cree_le, id
         ) as rang
    from packs
   where slug is null or btrim(slug) = ''
)
update packs p
   set slug = case
                when n.rang = 1 then coalesce(nullif(left(n.base, 60), ''), 'pack')
                else coalesce(nullif(left(n.base, 60), ''), 'pack') || '-' || n.rang
              end
  from numerotes n
 where p.id = n.id;

create unique index if not exists packs_slug_idx on packs (slug);

-- ---------------------------------------------------------------- le contenu

-- La couverture entre dans l'album : les packs photographiés avant cette
-- migration ouvrent leur fiche sur la photo qu'on leur connaît.
update packs
   set images = array[image_url]
 where image_url is not null
   and images = '{}';

-- Les descriptions du salon sont déjà des listes — « Hammam . Gommage .
-- Enveloppement à l'argile verte » — écrites d'un trait faute d'un endroit où
-- les ranger. La fiche leur donne cet endroit. Le séparateur exige une espace
-- avant le point : un point de fin de phrase ne coupe donc rien, et une
-- description qui n'est qu'une phrase reste une phrase.
update packs
   set inclusions = liste.parties
  from (
    select p.id,
           array(
             select btrim(part)
               from unnest(regexp_split_to_array(p.description, '\s+[·.]\s+')) as part
              where btrim(part) <> ''
           ) as parties
      from packs p
  ) as liste
 where packs.id = liste.id
   and packs.inclusions = '{}'
   and array_length(liste.parties, 1) >= 2;

-- ------------------------------------------------------------ la réservation

-- Les quatre packs hammam de l'accueil portent le nom de la prestation qui
-- les réserve. Les relier ici évite au salon de refaire à la main un
-- rapprochement que la base sait faire.
update packs p
   set prestation_id = pr.id
  from prestations pr
 where p.prestation_id is null
   and lower(btrim(pr.nom)) = lower(btrim(p.nom));

-- La durée annoncée sur la fiche part de celle qui décide des créneaux : deux
-- chiffres différents pour le même rituel se liraient comme une erreur.
update packs p
   set duree_minutes = pr.duree_minutes
  from prestations pr
 where p.duree_minutes is null
   and p.prestation_id = pr.id;

grant execute on function texte_en_slug(text) to anon, authenticated;
