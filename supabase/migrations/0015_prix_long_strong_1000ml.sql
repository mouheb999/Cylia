-- Le litre était au prix du petit flacon. Chez Keune, un 1000 ml se vend
-- autour de 154 DT quand le 300 ml en vaut 88 : c'est ce prix-là qu'il prend.
update produits
   set prix = 154.00
 where slug = 'keune-long-strong-shampooing-1000ml';
