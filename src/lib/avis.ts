/**
 * Avis de clientes, recopiés de la fiche Google du salon.
 *
 * Les mots sont les leurs : seuls les émojis sont tombés, et quelques fautes
 * de frappe ont été reprises (« cette établissement », « était » pour
 * « étaient ») — rien qui change ce que la cliente a voulu dire. Le nom
 * s'arrête à l'initiale : l'avis est public sur Google, mais il n'a pas été
 * écrit pour s'afficher en grand sur notre propre site.
 *
 * Pas de date : « il y a un mois » serait faux le mois suivant.
 */
export type Avis = {
  nom: string;
  /** Ce que la cliente est venue faire, quand elle le dit. */
  soins?: string;
  texte: string;
};

export const AVIS_CLIENTES: Avis[] = [
  {
    nom: "Farah K.",
    soins: "Hammam · Balayage",
    texte:
      "Une très belle expérience au Centre Cylia Maison de Beauté. Un endroit élégant, propre et très agréable, avec une équipe professionnelle, accueillante et aux petits soins. J'ai particulièrement apprécié la qualité des prestations, le sérieux et l'attention portée aux détails. Je recommande vivement cette adresse pour celles qui recherchent un moment de beauté et de détente dans un cadre raffiné.",
  },
  {
    nom: "Sofia R.",
    soins: "Head Spa",
    texte:
      "J'ai vécu une expérience incroyable aujourd'hui. J'ai choisi comme prestation le « Head Spa ». Ibtiseme était aux petits soins. Je recommande vivement cet établissement. L'accueil, l'hygiène ainsi que le professionnalisme de l'équipe étaient au rendez-vous. Je reviendrai avec plaisir. Merci encore.",
  },
  {
    nom: "Barbara M.",
    soins: "Microblading · Cils · Massage",
    texte:
      "Un lieu élégant et un personnel aimable et accueillant… J'ai bénéficié d'un microblading, d'une extension de cils et d'un massage complet… Un professionnalisme irréprochable ! Je recommande à 100 %.",
  },
  {
    nom: "Soultana C.",
    soins: "Spa",
    texte:
      "Une très belle expérience ! Un spa magnifique, des soins au top et surtout une équipe adorable, très gentille et aux petits soins du début à la fin. Merci pour votre accueil et pour ce merveilleux moment de détente. Je recommande à 100 % !",
  },
  {
    nom: "Maddie M.",
    soins: "Coiffure",
    texte:
      "Great salon that helped me with a hairstyle to attend a wedding. The staff were friendly and welcoming and the appointment was very professional and relaxing. The result was very elegant and lasted well through the day despite intense summer weather. Highly recommend and would return in the future.",
  },
  {
    nom: "Maiwenn V.",
    soins: "Hammam · Massage · Brushing",
    texte:
      "Très bonne expérience chez Cylia Maison de Beauté. Nous nous sommes bien détendus lors du Hammam/Gommage plus le massage qui était très relaxant. Les brushings étaient aussi très beaux. Je recommande ce salon.",
  },
  {
    nom: "Yosra Y.",
    texte:
      "Une très belle expérience au centre Cylia Maison de Beauté. Un accueil chaleureux, une équipe professionnelle et attentionnée, et un cadre agréable qui invite à la détente. Tout était parfait, du début à la fin. Merci à toute l'équipe pour ce merveilleux moment de bien-être. Je recommande vivement !",
  },
  {
    nom: "Faten J.",
    texte:
      "Je recommande vivement ! Service professionnel, excellents soins et produits de qualité. Je reviendrai sans hésiter.",
  },
];
