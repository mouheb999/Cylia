"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { enregistrerContenu, reinitialiserContenu } from "@/app/actions/admin";
import FeuilleEdition from "./FeuilleEdition";

export type TypeChamp = "texte" | "multiligne" | "lien" | "image";

export type ChampEdition = {
  cle: string;
  titre: string;
  valeur: string;
  defaut: string;
  type: TypeChamp;
  /** Sous-dossier du bucket, pour les photos. */
  dossier?: string;
};

type Edition = {
  estAdmin: boolean;
  /** Le mode édition est allumé — les blocs modifiables se signalent. */
  actif: boolean;
  basculer: () => void;
  /** Valeur enregistrée pour cette clé, ou celle fournie par le code. */
  valeur: (cle: string, defaut: string) => string;
  ouvrir: (champ: Omit<ChampEdition, "valeur">) => void;
};

const INERTE: Edition = {
  estAdmin: false,
  actif: false,
  basculer: () => {},
  valeur: (_cle, defaut) => defaut,
  ouvrir: () => {},
};

const Contexte = createContext<Edition>(INERTE);

/**
 * Hors du fournisseur — c'est-à-dire pour une visiteuse — le contexte inerte
 * renvoie simplement la valeur par défaut. Les composants modifiables peuvent
 * donc s'utiliser partout sans se demander qui les regarde.
 */
export function useEdition(): Edition {
  return useContext(Contexte);
}

export function FournisseurEdition({
  estAdmin,
  contenus,
  children,
}: {
  estAdmin: boolean;
  contenus: Record<string, string>;
  children: ReactNode;
}) {
  const router = useRouter();
  const [actif, setActif] = useState(false);
  const [valeurs, setValeurs] = useState(contenus);
  const [champ, setChamp] = useState<ChampEdition | null>(null);

  const valeur = useCallback(
    (cle: string, defaut: string) => {
      const enregistree = valeurs[cle];
      return enregistree !== undefined && enregistree !== "" ? enregistree : defaut;
    },
    [valeurs],
  );

  const ouvrir = useCallback(
    (demande: Omit<ChampEdition, "valeur">) => {
      setChamp({ ...demande, valeur: valeurs[demande.cle] ?? "" });
    },
    [valeurs],
  );

  async function enregistrer(nouvelle: string) {
    if (!champ) return;
    const type = champ.type === "image" ? "image" : champ.type === "lien" ? "lien" : "texte";
    const reponse = await enregistrerContenu(champ.cle, nouvelle, type);
    if (!reponse.ok) throw new Error(reponse.message);
    // Affichage mis à jour tout de suite, puis les composants serveur relisent
    // la base : la page reste juste même si la cliente ne recharge pas.
    setValeurs((precedent) => ({ ...precedent, [champ.cle]: nouvelle }));
    setChamp(null);
    router.refresh();
  }

  async function reinitialiser() {
    if (!champ) return;
    const reponse = await reinitialiserContenu(champ.cle);
    if (!reponse.ok) throw new Error(reponse.message);
    setValeurs((precedent) => {
      const suite = { ...precedent };
      delete suite[champ.cle];
      return suite;
    });
    setChamp(null);
    router.refresh();
  }

  const contexte = useMemo<Edition>(
    () => ({
      estAdmin,
      actif: estAdmin && actif,
      basculer: () => setActif((v) => !v),
      valeur,
      ouvrir,
    }),
    [estAdmin, actif, valeur, ouvrir],
  );

  return (
    <Contexte.Provider value={contexte}>
      {children}
      {champ && (
        <FeuilleEdition
          champ={champ}
          onFermer={() => setChamp(null)}
          onEnregistrer={enregistrer}
          onReinitialiser={reinitialiser}
        />
      )}
    </Contexte.Provider>
  );
}
