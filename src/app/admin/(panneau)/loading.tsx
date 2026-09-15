import Squelette, { CarteSquelette } from "@/components/ui/Squelette";

/**
 * Attente commune à tous les écrans du panneau.
 *
 * Un seul fichier pour les sept : l'en-tête et la barre d'onglets vivent dans
 * la mise en page et ne bougent pas d'un écran à l'autre, seule la zone
 * centrale change. C'est aussi ce fichier qui rend le préchargement des onglets
 * utile — sans lui, Next n'a rien à montrer avant la réponse du serveur et le
 * clic reste sans effet visible.
 */
export default function ChargementPanneau() {
  return (
    <div>
      <Squelette className="h-8 w-52" />
      <Squelette className="mt-3 h-4 w-72 max-w-full" />

      <div className="mt-6 flex gap-2">
        <Squelette className="h-9 w-24 rounded-full" />
        <Squelette className="h-9 w-28 rounded-full" />
        <Squelette className="h-9 w-24 rounded-full" />
      </div>

      <div className="mt-5 space-y-3">
        <CarteSquelette />
        <CarteSquelette />
        <CarteSquelette />
      </div>
    </div>
  );
}
