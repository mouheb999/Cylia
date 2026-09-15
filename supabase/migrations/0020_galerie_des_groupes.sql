-- Le groupe portait une photo ; il en porte maintenant une galerie.
--
-- Une seule vignette par prestation, répétée quinze fois dans la liste de
-- l'épilation, ne montrait rien : quinze fois la même icône. La photo a plus
-- de valeur en grand, une fois le groupe ouvert — et plusieurs valent mieux
-- qu'une, que la cliente fait défiler comme un petit album de la cabine.
--
-- `image_url` reste la couverture, celle de la vignette du groupe dans la
-- liste. `images` est l'album : la couverture en tête, puis le reste.
alter table groupes
  add column if not exists images text[] not null default '{}';

update groupes
   set images = array[image_url]
 where image_url is not null
   and images = '{}';

-- ------------------------------------------------------- les descriptions
--
-- Les massages et les packs Head Spa ont leur phrase sous la durée ; le reste
-- du catalogue n'avait que son nom. « Rajeunissement » ou « Visage au fil » ne
-- disent pas, seuls, ce qui attend la cliente. Une phrase courte, factuelle,
-- de la même main que celles des massages.

update prestations set description = 'Coupe, lavage et mise en forme au brushing.'              where id = 'coupe-brushing';
update prestations set description = 'Couleur sur toute la chevelure ou sur les racines.'       where id = 'coloration';
update prestations set description = 'Des mèches éclaircies, fondues sur les longueurs.'        where id = 'balayage';
update prestations set description = 'Un masque Keune choisi selon l''état des cheveux.'        where id = 'soin-capillaire';

update prestations set description = 'Nettoyage, gommage et masque, selon votre peau.'          where id = 'soin-visage';
update prestations set description = 'Un rasage fin qui retire duvet et cellules mortes.'       where id = 'dermaplaning';
update prestations set description = 'Une exfoliation aux acides doux, pour relancer l''éclat.' where id = 'peeling';
update prestations set description = 'Des actifs fermeté et éclat, pour repulper le teint.'     where id = 'soin-anti-age';
update prestations set description = 'Un protocole ciblé sur les traces du temps.'              where id = 'rajeunissement';

update prestations set description = 'Nettoyage par aspiration, puis sérums hydratants.'        where id = 'hydrafacial';
update prestations set description = 'Ultrasons focalisés : l''ovale se raffermit sans bistouri.' where id = 'hifu';
update prestations set description = 'Exfoliation, oxygénation et infusion d''actifs.'          where id = 'oxygeneo';
update prestations set description = 'De fines aiguilles relancent la production de collagène.' where id = 'microneedling';

update prestations set description = 'La ligne redessinée à la cire tiède.'                     where id = 'epil-sourcils-cire';
update prestations set description = 'Le fil de coton, précis et sans cire.'                    where id = 'epil-sourcils-fil';
update prestations set description = 'Sourcils disciplinés, cils recourbés durablement.'        where id = 'epil-browlift-lashlift';
update prestations set description = 'Le duvet du visage retiré au fil, sans produit.'          where id = 'epil-visage-fil';
update prestations set description = 'Visage et cou, suivis d''un masque apaisant.'             where id = 'epil-visage-cou-azulene';
update prestations set description = 'La lèvre supérieure, en quelques minutes.'                where id = 'epil-moustaches';
update prestations set description = 'Rapide, à la cire.'                                       where id = 'epil-aisselles';
update prestations set description = 'Des poignets aux coudes.'                                 where id = 'epil-demi-bras';
update prestations set description = 'Des poignets aux épaules.'                                where id = 'epil-bras-complets';
update prestations set description = 'Des chevilles aux genoux.'                                where id = 'epil-demi-jambes';
update prestations set description = 'Des chevilles au haut des cuisses.'                       where id = 'epil-jambes-completes';
update prestations set description = 'Maillot classique ou intégral, à votre convenance.'       where id = 'epil-zone-intime';
update prestations set description = 'Le dos entier, épaules comprises.'                        where id = 'epil-dos';
update prestations set description = 'Le ventre et la ligne du nombril.'                        where id = 'epil-ventre';
update prestations set description = 'Tout le corps en une seule séance.'                       where id = 'epil-corps-complet';

update prestations set description = 'Mise en beauté des mains, pose et vernis.'                where id = 'ongles';
update prestations set description = 'Jour, soirée ou mariée, selon l''occasion.'               where id = 'make-up';
